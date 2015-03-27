#!/bin/zsh
# Plot the execution time data from the preprocessing/rewriting step.
re='^[0-9]+$'

#dirs=$*

NAIEVEFREQ=5

data="output/.train.data"
echo "Annotation Interval+Caching Interval Expiration+Caching Expiration" > $data
#Reification Singletonproperties Graphs Implicitgraphs
for TYPE in reification singletonproperties graphs implicitgraphs; do
    unset matrix
    typeset -A matrix
    for INTERVAL in true false; do
      for CACHING in true false; do
          dircount=0
          for dir in $@; do
            let "dircount++"
            if [[ "$TYPE" == "none" ]]; then
              input="output/$dir/naieve-$NAIEVEFREQ.txt"
            else
              input="output/$dir/annotation-"$TYPE"_interval-"$INTERVAL"_caching-"$CACHING".txt"
            fi
            fline=$(head -1 $input)
            value=${matrix[$TYPE]}
            if ! [[ $value =~ $re ]]; then value="0" ;fi
            matrix[${INTERVAL}${CACHING}]=$(echo "$fline + $value" | bc -l)
        done
      done
    done

    line=$TYPE
    for INTERVAL in true false; do
      for CACHING in true false; do
          value=${matrix[${INTERVAL}${CACHING}]}
          if ! [[ $value =~ $re ]]; then
            # makes sure the point isn't drawn
            value="a"
          else
            value=$(echo "scale=2;$value / $dircount" | bc -l)
          fi
          line=$line" "$value
      done
    done
    echo $line >> $data

done

file="output/plots/"$dir"-rewriting.png"
gnuplot plotTrainTestsRewriting.gplot > $file
