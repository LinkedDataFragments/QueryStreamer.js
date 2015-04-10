package org.linkeddatafragments.cqelstrain.server;

import com.hp.hpl.jena.sparql.core.Var;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import org.apache.commons.io.IOUtils;
import org.deri.cqels.data.Mapping;
import org.deri.cqels.engine.ContinuousListener;
import org.deri.cqels.engine.ContinuousSelect;
import org.deri.cqels.engine.ExecContext;
import org.linkeddatafragments.cqelstrain.Main;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.util.Iterator;

/**
 * The endpoint that will accept queries.
 * @author Ruben Taelman
 */
public class HttpEndpoint implements HttpHandler {

    protected ExecContext engine;

    public HttpEndpoint(ExecContext engine) {
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

    @Override
    public void handle(HttpExchange httpExchange) throws IOException {
        System.out.println("Query registration");
        final String query = IOUtils.toString(httpExchange.getRequestBody());
        ContinuousSelect selQuery = engine.registerSelect(query);
        httpExchange.sendResponseHeaders(200, 0);
        final OutputStream os = httpExchange.getResponseBody();
        selQuery.register(new ContinuousListener() {
            public void update(Mapping mapping) {
                String result = "";
                for (Iterator<Var> vars = mapping.vars(); vars.hasNext(); ) {
                    long id = mapping.get(vars.next());
                    if(id >= 0) {
                        result += " " + engine.engine().decode(id);
                    }
                }
                try {
                    os.write(result.getBytes());
                    os.flush();
                    System.out.println("Wrote query results of length " + result.length());
                } catch (IOException e) {
                    try {
                        os.close();
                    } catch (IOException e2) {}
                }
            }
        });
    }
}
