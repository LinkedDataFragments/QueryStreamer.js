package org.linkeddatafragments.csparqlserver;

import eu.larkc.csparql.engine.CsparqlEngine;
import eu.larkc.csparql.engine.CsparqlEngineImpl;
import org.linkeddatafragments.csparqlserver.server.DynamicData;
import org.linkeddatafragments.csparqlserver.server.HttpEndpoint;
import org.linkeddatafragments.csparqlserver.server.StaticData;

import java.io.IOException;

/**
 * @author Ruben Taelman
 */
public class Main {

    public static boolean DEBUG = true;

    static {
        if(!DEBUG)
            System.setProperty("org.apache.commons.logging.Log",
                "org.apache.commons.logging.impl.NoOpLog");
    }

    public static final String PREFIX_TRAIN = "http://example.org/train#";
    public static String API_URL = "https://irail.be//stations/NMBS/008892007";
    public static int STATICPORT = 3001;
    public static int PORT = 3002;
    public static int DATA_FREQUENCY = 10;
    public static int CLIENTS = 100;

    public static void main(String[] args) throws IOException, InterruptedException {
        if(System.getenv().containsKey("DEBUG")) DEBUG = Boolean.parseBoolean(System.getenv().get("DEBUG"));
        if(System.getenv().containsKey("API_URL")) API_URL = System.getenv().get("API_URL");
        if(System.getenv().containsKey("STATIC_PORT")) STATICPORT = Integer.parseInt(System.getenv().get("STATIC_PORT"));
        if(System.getenv().containsKey("DATA_FREQUENCY")) DATA_FREQUENCY = Integer.parseInt(System.getenv().get("DATA_FREQUENCY"));
        if(System.getenv().containsKey("CLIENTS")) CLIENTS = Integer.parseInt(System.getenv().get("CLIENTS"));

        if(DEBUG) {
            System.out.println("API_URL: " + API_URL);
            System.out.println("STATIC_PORT: " + STATICPORT);
            System.out.println("PUBLIC_PORT: " + PORT);
            System.out.println("DATA_FREQUENCY: " + DATA_FREQUENCY);
            System.out.println("CLIENTS: " + CLIENTS);
        }

        new StaticData();
        DynamicData stream = new DynamicData("http://myexample.org/stream", Main.DATA_FREQUENCY * 1000);

        CsparqlEngine engine = new CsparqlEngineImpl();
        engine.initialize(true);
        engine.registerStream(stream);

        final Thread t = new Thread(stream);
        t.start();
        new HttpEndpoint(engine);
    }

}
