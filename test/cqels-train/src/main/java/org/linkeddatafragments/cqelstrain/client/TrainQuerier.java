package org.linkeddatafragments.cqelstrain.client;

import com.hp.hpl.jena.sparql.core.Var;
import org.deri.cqels.data.Mapping;
import org.deri.cqels.engine.ContinuousListener;
import org.deri.cqels.engine.ContinuousSelect;
import org.deri.cqels.engine.ExecContext;
import org.linkeddatafragments.cqelstrain.Main;
import org.linkeddatafragments.cqelstrain.server.DynamicData;
import org.linkeddatafragments.cqelstrain.server.StaticData;
import org.linkeddatafragments.cqelstrain.server.Stream;

import java.io.File;
import java.io.IOException;
import java.util.Iterator;

/**
 * C-SPARQL query implementation.
 * @author Ruben Taelman
 */
public class TrainQuerier {

    public void run() {
        String query = "PREFIX t: <http://example.org/train#> "
                     + "SELECT ?id ?id2 ?delay ?headSign ?routeLabel ?platform ?departureTime "
                     //+ "FROM NAMED <" + Main.staticFile + ">"
                     + "WHERE {"
                     + "  STREAM <http://myexample.org/streamdelay> [ALL] { ?id t:delay ?delay . } " //RANGE 1m
                     + "  STREAM <http://myexample.org/streamplatform> [ALL] { ?id t:platform ?platform } "
                     + "   { " // GRAPH <" + Main.staticFile + ">
                     //+ "  ?id t:headSign ?headSign . "
                     + "  ?id t:routeLabel ?routeLabel . "
                     + "  ?id t:departureTime ?departureTime ."
                     + "}"
                     + "} ";

        final ExecContext context = new ExecContext(".", false);
        new StaticData(context);
        DynamicData streamdelay = new Stream(context, "delay", Main.DATA_FREQUENCY * 1000);
        DynamicData streamplatform = new Stream(context, "platform", Main.DATA_FREQUENCY * 1000);
        ContinuousSelect selQuery = context.registerSelect(query);
        if(Main.DEBUG) {
            selQuery.register(new ContinuousListener() {
                public void update(Mapping mapping) {
                    String result = "";
                    for (Iterator<Var> vars = mapping.vars(); vars.hasNext(); ) {
                        //Use context.engine().decode(...) to decode the encoded value to RDF Node
                        long id = mapping.get(vars.next());
                        if(id >= 0) {
                            result += " " + context.engine().decode(id);
                        }
                    }
                    System.out.println(result);
                }
            });
        }

        new Thread(streamdelay).start();
        new Thread(streamplatform).start();
    }

}
