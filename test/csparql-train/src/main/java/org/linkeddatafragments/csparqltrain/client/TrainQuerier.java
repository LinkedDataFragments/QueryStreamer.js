package org.linkeddatafragments.csparqltrain.client;

import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import eu.larkc.csparql.engine.ConsoleFormatter;
import eu.larkc.csparql.engine.CsparqlQueryResultProxy;
import org.linkeddatafragments.csparqltrain.CsparqlEngineInstrumented;
import org.linkeddatafragments.csparqltrain.Main;
import org.linkeddatafragments.csparqltrain.server.DynamicData;

import java.io.PrintStream;
import java.text.ParseException;
import java.util.List;
import java.util.Map;

/**
 * C-SPARQL query implementation.
 * @author Ruben Taelman
 */
public class TrainQuerier {

    private int clients;

    public TrainQuerier(int clients) {
        this.clients = clients;
    }

    public void run() {
        String query = "REGISTER QUERY TrainDepartures AS "
                     + "PREFIX t: <http://example.org/train#> "
                     + "SELECT ?delay ?headSign ?routeLabel ?platform ?departureTime "
                     + "FROM STREAM <http://myexample.org/stream> [RANGE 1h STEP " + Main.QUERY_FREQUENCY + "s] "
                     + "FROM <http://127.0.0.1:" + Main.PORT +"/static>"
                     + "WHERE { "
                     + "  _:id t:delay ?delay . "
                     + "  _:id t:headSign ?headSign . "
                     + "  _:id t:routeLabel ?routeLabel . "
                     + "  _:id t:platform ?platform . "
                     + "  _:id t:departureTime ?departureTime . "
                     + "} ";
        DynamicData stream = new DynamicData("http://myexample.org/stream", Main.DATA_FREQUENCY * 1000);

        CsparqlEngineInstrumented engine = new CsparqlEngineInstrumented();
        engine.initialize(true);
        engine.registerStream(stream);

        final Thread t = new Thread(stream);
        t.start();

        DurationManager durationManager = new DurationManager(clients, System.out);

        try {
            for(int i = 0; i < clients; i++) {
                CsparqlQueryResultProxy queryProxy = engine.registerQuery(query, new ClientDurationCallback(i, durationManager));
                if (Main.DEBUG) queryProxy.addObserver(new ConsoleFormatter());
            }
        } catch (ParseException e) {
            e.printStackTrace();
        }
    }

    private static class ClientDurationCallback implements CsparqlEngineInstrumented.IDurationCallback {

        private final int c;
        private DurationManager durationManager;

        public ClientDurationCallback(int c, DurationManager durationManager) {
            this.c = c;
            this.durationManager = durationManager;
        }

        @Override
        public void onUpdate(long duration) {
            durationManager.onUpdate(c, duration);
        }

    }

    private static class DurationManager {

        private Map<Integer, List<Long>> durationResults = Maps.newHashMap();
        private int clients;
        private PrintStream pw;

        public DurationManager(int clients, PrintStream pw) {
            this.clients = clients;
            for(int i = 0; i < clients; i++) {
                durationResults.put(i, Lists.<Long>newLinkedList());
            }
            this.pw = pw;
        }

        public synchronized void onUpdate(int client, long duration) {
            durationResults.get(client).add(duration);
            checkResults();
        }

        private void checkResults() {
            int minLength = Integer.MAX_VALUE;
            for(List<Long> l : durationResults.values()) {
                minLength = Math.min(l.size(), minLength);
            }

            if(minLength > 0) {
                long duration = 0;
                for(List<Long> l : durationResults.values()) {
                    duration += l.get(0);
                    l.remove(0);
                }
                duration /= clients;
                pw.println(duration);
            }
        }

    }
}
