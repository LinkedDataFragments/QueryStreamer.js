package org.linkeddatafragments.cqelstrain.server;

import com.hp.hpl.jena.rdf.model.Model;
import com.hp.hpl.jena.rdf.model.ModelFactory;
import com.hp.hpl.jena.rdf.model.impl.PropertyImpl;
import com.hp.hpl.jena.rdf.model.impl.ResourceImpl;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import org.deri.cqels.engine.ExecContext;
import org.linkeddatafragments.cqelstrain.Main;
import org.linkeddatafragments.streamsparqlcommon.irail.Graph;
import org.linkeddatafragments.streamsparqlcommon.irail.Result;
import org.linkeddatafragments.streamsparqlcommon.irail.TrainData;

import javax.xml.bind.DatatypeConverter;
import java.io.*;
import java.net.InetSocketAddress;

/**
 * A server that provides static train data.
 * @author Ruben Taelman
 */
public class StaticData {

    public static StaticData instance = null;

    private Model model;
    private long lastUpdate = -1;
    private static final int UPDATE_FREQ = 10000;
    private ExecContext context;

    public StaticData(ExecContext context) {
        model = ModelFactory.createDefaultModel();
        instance = this;
        this.context = context;
        triggerStaticFileUpdate();
    }

    protected String getResponse(String type) {
        try {
            Result result = TrainData.getInstance().get(Main.API_URL);
            for (Graph graph : result.graphs) {
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
        model.write(sw, type);
        return sw.toString();
    }

    public void triggerStaticFileUpdate() {
        if(System.currentTimeMillis() - lastUpdate > UPDATE_FREQ) {
            String data = getResponse("Turtle");
            try {
                PrintWriter writer = new PrintWriter(Main.staticFile, "UTF-8");
                writer.print(data);
                writer.close();
            } catch (FileNotFoundException e) {
                e.printStackTrace();
            } catch (UnsupportedEncodingException e) {
                e.printStackTrace();
            }
            context.loadDataset(Main.staticFile, Main.staticFile);
            //context.loadDefaultDataset(Main.staticFile);
            //context.loadDefaultDataset(Main.staticFile);
            lastUpdate = System.currentTimeMillis();
        }
    }

}
