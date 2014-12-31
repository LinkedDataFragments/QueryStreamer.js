package org.linkeddatafragments.csparqltrain;

import com.google.common.collect.Maps;
import eu.larkc.csparql.cep.api.RdfQuadruple;
import eu.larkc.csparql.cep.api.RdfSnapshot;
import eu.larkc.csparql.common.streams.format.GenericObservable;
import eu.larkc.csparql.engine.CsparqlEngineImpl;
import eu.larkc.csparql.engine.CsparqlQueryResultProxy;

import java.text.ParseException;
import java.util.List;
import java.util.Map;

/**
 * An extension of the standard C-SPARQL engine to allow custom time measurements.
 * @author Ruben Taelman
 */
public class CsparqlEngineInstrumented extends CsparqlEngineImpl {

    private Map<String, IDurationCallback> durationCallbacks = Maps.newHashMap();

    public CsparqlQueryResultProxy registerQuery(String command, IDurationCallback durationCallback) throws ParseException {
        CsparqlQueryResultProxy proxy = super.registerQuery(command);
        durationCallbacks.put(proxy.getId(), durationCallback);
        return proxy;
    }

    @Override
    public void update(GenericObservable<List<RdfQuadruple>> o, List<RdfQuadruple> arg) {
        //System.out.print("a");
        long starttime = System.nanoTime();
        super.update(o, arg);
        long duration = System.nanoTime() - starttime;

        synchronized (this) {
            RdfSnapshot r = (RdfSnapshot) o;
            durationCallbacks.get(r.getId()).onUpdate(duration);
        }
    }

    public static interface IDurationCallback {

        public void onUpdate(long duration);

    }

}
