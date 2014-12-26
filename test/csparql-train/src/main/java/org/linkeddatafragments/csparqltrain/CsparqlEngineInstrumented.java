package org.linkeddatafragments.csparqltrain;

import eu.larkc.csparql.cep.api.RdfQuadruple;
import eu.larkc.csparql.common.streams.format.GenericObservable;
import eu.larkc.csparql.engine.CsparqlEngineImpl;

import java.util.List;

/**
 * An extension of the standard C-SPARQL engine to allow custom time measurements.
 * @author Ruben Taelman
 */
public class CsparqlEngineInstrumented extends CsparqlEngineImpl {

    @Override
    public void update(GenericObservable<List<RdfQuadruple>> o, List<RdfQuadruple> arg) {
        long starttime = System.nanoTime();
        super.update(o, arg);
        long duration = System.nanoTime() - starttime;
        System.out.println(duration);
    }

}
