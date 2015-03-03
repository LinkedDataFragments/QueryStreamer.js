package org.linkeddatafragments.csparqlserver.server;

import com.google.common.collect.Maps;
import eu.larkc.csparql.cep.api.RdfQuadruple;
import eu.larkc.csparql.cep.api.RdfStream;
import org.linkeddatafragments.csparqlserver.Main;
import org.linkeddatafragments.streamsparqlcommon.irail.Graph;
import org.linkeddatafragments.streamsparqlcommon.irail.Result;
import org.linkeddatafragments.streamsparqlcommon.irail.TrainData;

import java.io.IOException;
import java.util.Map;

/**
 * A server that provides dynamic train data.
 * @author Ruben Taelman
 */
public class DynamicData extends RdfStream implements Runnable {

    private volatile boolean run = true;

    private long timeout;

    private Map<String, String> lastDelays    = Maps.newHashMap();
    private Map<String, String> lastPlatforms = Maps.newHashMap();

    public DynamicData(String iri, long timeout) {
        super(iri);
        this.timeout = timeout;
    }

    @Override
    public void run() {
        while(run) {
            long time = System.currentTimeMillis();
            try {
                Result result = TrainData.getInstance().get(Main.API_URL);
                Map<String, String> newDelays    = Maps.newHashMap();
                Map<String, String> newPlatforms = Maps.newHashMap();
                for (Graph graph : result.graphs) {
                    if(!graph.delay.equals(lastDelays.get(graph.id))) {
                        put(new RdfQuadruple(
                                graph.id,
                                Main.PREFIX_TRAIN + "delay",
                                graph.delay,
                                time));
                        newDelays.put(graph.id, graph.delay);
                    }
                    if(!graph.platform.equals(lastPlatforms.get(graph.id))) {
                        put(new RdfQuadruple(
                                graph.id,
                                Main.PREFIX_TRAIN + "platform",
                                graph.platform,
                                time));
                        newPlatforms.put(graph.id, graph.platform);
                    }
                }
                lastDelays = newDelays;
                lastPlatforms = newPlatforms;
            } catch (IOException e) {
                e.printStackTrace();
            }

            try {
                Thread.sleep(timeout);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    public void halt() {
        this.run = false;
    }

}
