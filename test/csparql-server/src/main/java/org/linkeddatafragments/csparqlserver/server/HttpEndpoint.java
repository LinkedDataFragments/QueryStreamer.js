package org.linkeddatafragments.csparqlserver.server;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import eu.larkc.csparql.common.RDFTable;
import eu.larkc.csparql.common.RDFTuple;
import eu.larkc.csparql.common.streams.format.GenericObservable;
import eu.larkc.csparql.common.streams.format.GenericObserver;
import eu.larkc.csparql.engine.CsparqlEngine;
import eu.larkc.csparql.engine.CsparqlQueryResultProxy;
import org.apache.commons.io.IOUtils;
import org.linkeddatafragments.csparqlserver.Main;

import java.io.IOException;
import java.io.OutputStream;
import java.io.StringWriter;
import java.net.InetSocketAddress;
import java.util.Collection;

/**
 * The endpoint that will accept queries.
 * @author Ruben Taelman
 */
public class HttpEndpoint implements HttpHandler {

    protected CsparqlEngine engine;

    public HttpEndpoint(CsparqlEngine engine) {
        this.engine = engine;
        try {
            HttpServer server = HttpServer.create(new InetSocketAddress(Main.PORT), 0);
            server.createContext("/register", this);
            server.setExecutor(null);
            server.start();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    protected String tuplesToString(Collection<RDFTuple> tuples) {
        StringWriter writer = new StringWriter();
        for(RDFTuple tuple : tuples) {
            writer.append(tuple.toString());
            writer.append('\n');
        }
        return writer.toString();
    }

    @Override
    public void handle(HttpExchange httpExchange) throws IOException {
        final String query = IOUtils.toString(httpExchange.getRequestBody());
        try {
            final CsparqlQueryResultProxy queryProxy = engine.registerQuery(query);
            httpExchange.sendResponseHeaders(200, 0);
            final OutputStream os = httpExchange.getResponseBody();
            queryProxy.addObserver(new GenericObserver<RDFTable>() {
                @Override
                public void update(GenericObservable<RDFTable> rdfTableGenericObservable, RDFTable rdfTuples) {
                    try {
                        os.write(tuplesToString(rdfTuples.getTuples()).getBytes());
                        os.flush();
                    } catch (IOException e) {
                        try {
                            os.close();
                            engine.stopQuery(query);
                            engine.unregisterQuery(query);
                        } catch (IOException e2) {}
                    }
                }
            });
        } catch (java.text.ParseException e) {
            e.printStackTrace();
            throw new IOException(e);
        }
    }
}
