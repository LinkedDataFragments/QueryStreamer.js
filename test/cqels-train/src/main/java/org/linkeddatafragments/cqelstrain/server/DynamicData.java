package org.linkeddatafragments.cqelstrain.server;

import com.google.common.collect.Maps;
import org.deri.cqels.engine.ExecContext;
import org.deri.cqels.engine.RDFStream;
import org.linkeddatafragments.cqelstrain.Main;
import org.linkeddatafragments.streamsparqlcommon.irail.Graph;
import org.linkeddatafragments.streamsparqlcommon.irail.Result;
import org.linkeddatafragments.streamsparqlcommon.irail.TrainData;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.UnsupportedEncodingException;
import java.util.Map;

/**
 * A server that provides dynamic train data.
 * @author Ruben Taelman
 */
public abstract class DynamicData extends RDFStream implements Runnable {

    private volatile boolean run = true;

    private long timeout;

    public DynamicData(ExecContext context, String iri, long timeout) {
        super(context, iri);
        this.timeout = timeout;
    }

    protected abstract void graphAction(Graph graph);

    @Override
    public void run() {
        while(run) {
            try {
                Result result = TrainData.getInstance().get(Main.API_URL);
                for (Graph graph : result.graphs) {
                    graphAction(graph);
                }
            } catch (IOException e) {
                e.printStackTrace();
            }

            StaticData.instance.triggerStaticFileUpdate();

            try {
                Thread.sleep(timeout);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }



    @Override
    public void stop() {
        this.run = false;
    }
}
