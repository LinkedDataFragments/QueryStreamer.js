package org.linkeddatafragments.cqelstrain;

import org.linkeddatafragments.cqelstrain.client.TrainQuerier;
import org.linkeddatafragments.cqelstrain.server.StaticData;

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
    public static int PORT = 3002;
    public static int DATA_FREQUENCY = 1;

    public static void main(String[] args) throws IOException, InterruptedException {
        if(System.getenv().containsKey("DEBUG")) DEBUG = Boolean.parseBoolean(System.getenv().get("DEBUG"));
        if(System.getenv().containsKey("API_URL")) API_URL = System.getenv().get("API_URL");
        if(System.getenv().containsKey("STATIC_PORT")) PORT = Integer.parseInt(System.getenv().get("STATIC_PORT"));
        if(System.getenv().containsKey("DATA_FREQUENCY")) DATA_FREQUENCY = Integer.parseInt(System.getenv().get("DATA_FREQUENCY"));

        if(DEBUG) {
            System.out.println("API_URL: " + API_URL);
            System.out.println("STATIC_PORT: " + PORT);
            System.out.println("DATA_FREQUENCY: " + DATA_FREQUENCY);
        }

        new StaticData();
        new TrainQuerier().run();
    }

}
