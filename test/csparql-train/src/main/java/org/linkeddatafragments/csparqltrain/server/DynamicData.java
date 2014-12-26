package org.linkeddatafragments.csparqltrain.server;

import com.google.common.collect.Maps;
import eu.larkc.csparql.cep.api.RdfQuadruple;
import eu.larkc.csparql.cep.api.RdfStream;
import org.linkeddatafragments.csparqltrain.Main;
import org.linkeddatafragments.csparqltrain.irail.Graph;
import org.linkeddatafragments.csparqltrain.irail.Result;
import org.linkeddatafragments.csparqltrain.irail.TrainData;

import java.io.IOException;
import java.util.Map;

/**
 * A server that provides dynamic train data.
 * @author Ruben Taelman
 */
public class DynamicData extends RdfStream implements Runnable {

    private volatile boolean run = true;

    private long timeout;

    private final Map<String, String> lastDelays    = Maps.newHashMap();
    private final Map<String, String> lastPlatforms = Maps.newHashMap();

    public DynamicData(String iri, long timeout) {
        super(iri);
        this.timeout = timeout;
    }

    @Override
    public void run() {
        while(run) {
            long time = System.currentTimeMillis();
            try {
                Result result = TrainData.getInstance().get();
                for (Graph graph : result.graphs) {
                    if(!graph.delay.equals(lastDelays.get(graph.id))) {
                        put(new RdfQuadruple(
                                graph.id,
                                Main.PREFIX_TRAIN + "delay",
                                graph.delay,
                                time));
                        lastDelays.put(graph.id, graph.delay);
                    }
                    if(!graph.platform.equals(lastPlatforms.get(graph.id))) {
                        put(new RdfQuadruple(
                                graph.id,
                                Main.PREFIX_TRAIN + "platform",
                                graph.platform,
                                time));
                        lastPlatforms.put(graph.id, graph.platform);
                    }
                }
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
