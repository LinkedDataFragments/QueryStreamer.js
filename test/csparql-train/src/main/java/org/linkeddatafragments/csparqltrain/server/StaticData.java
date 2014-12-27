package org.linkeddatafragments.csparqltrain.server;

import com.hp.hpl.jena.rdf.model.Model;
import com.hp.hpl.jena.rdf.model.ModelFactory;
import com.hp.hpl.jena.rdf.model.impl.PropertyImpl;
import com.hp.hpl.jena.rdf.model.impl.ResourceImpl;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import org.linkeddatafragments.csparqltrain.Main;
import org.linkeddatafragments.streamsparqlcommon.irail.Graph;
import org.linkeddatafragments.streamsparqlcommon.irail.Result;
import org.linkeddatafragments.streamsparqlcommon.irail.TrainData;

import javax.xml.bind.DatatypeConverter;
import java.io.IOException;
import java.io.OutputStream;
import java.io.StringWriter;
import java.net.InetSocketAddress;

/**
 * A server that provides static train data.
 * @author Ruben Taelman
 */
public class StaticData implements HttpHandler {

    private Model model;

    public StaticData() {
        try {
            HttpServer server = HttpServer.create(new InetSocketAddress(Main.PORT), 0);
            server.createContext("/static", this);
            server.setExecutor(null);
            server.start();
        } catch (IOException e) {
            e.printStackTrace();
        }
        model = ModelFactory.createDefaultModel();
    }

    protected String getResponse() {
        try {
            Result result = TrainData.getInstance().get(Main.API_URL);
            for(Graph graph : result.graphs) {
                model.add(
                        new ResourceImpl(graph.stop),
                        new PropertyImpl(Main.PREFIX_TRAIN + "hasDeparture"),
                        new ResourceImpl(graph.id));
                model.add(
                        new ResourceImpl(graph.id),
                        new PropertyImpl(Main.PREFIX_TRAIN + "departureTime"),
                        model.createTypedLiteral(DatatypeConverter.parseDateTime(graph.scheduledDepartureTime)));
                model.add(
                        new ResourceImpl(graph.id),
                        new PropertyImpl(Main.PREFIX_TRAIN + "headSign"),
                        model.createTypedLiteral(graph.headsign));
                model.add(
                        new ResourceImpl(graph.id),
                        new PropertyImpl(Main.PREFIX_TRAIN + "routeLabel"),
                        model.createTypedLiteral(graph.routeLabel));
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        StringWriter sw = new StringWriter();
        model.write(sw, "RDF/XML");
        return sw.toString();
    }

    @Override
    public void handle(HttpExchange httpExchange) throws IOException {
        String response = getResponse();
        httpExchange.sendResponseHeaders(200, response.length());
        OutputStream os = httpExchange.getResponseBody();
        os.write(response.getBytes());
        os.close();
    }

}
