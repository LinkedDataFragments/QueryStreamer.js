#!/bin/zsh
# Prepare gnuplot data to plot execution times.
re='^[0-9]+$'

mkdir -p output/plots
#dirs=$@

NAIEVEFREQ=5

for CUMULATIVE in true false; do
  for REWRITING in true false; do
    tailoffset="+2"
    if $REWRITING; then
      # This will include the first data line, the rewriting step
      tailoffset="+1"
    fi
    for INTERVAL in true false; do
      for CACHING in true false; do
        unset matrix
        typeset -A matrix
        data="output/.train.data"
        echo "Duration Reification Singletonproperties Graphs Implicitgraphs Naieve" > $data
        maxi=0
        for TYPE in reification singletonproperties graphs implicitgraphs none; do
          #echo $TYPE
          dircount=0
          for dir in $@; do
            let "dircount++"
            if [[ "$TYPE" == "none" ]]; then
              input="output/$dir/naieve-$NAIEVEFREQ.txt"
            else
              input="output/$dir/annotation-"$TYPE"_interval-"$INTERVAL"_caching-"$CACHING".txt"
            fi
            i=0
            while read fline; do
              value=${matrix[$i,$TYPE]}
              count=${matrix[$i,$TYPE,count]}
              if ! [[ $value =~ $re ]]; then
                if $CUMULATIVE && [ $i -gt 0 ]; then
                  value=${matrix[$(echo "$i - 1" | bc -l),$TYPE]}
                else
                  value="0"
                fi
                count=0
              fi
              matrix[${i},${TYPE}]=$(echo "$fline + $value" | bc -l)
              matrix[${i},${TYPE},count]=$(echo "$count + 1" | bc -l)
              #echo "$fline + $value = ${matrix[$i,$TYPE]}"
              let "i++"
              if [ "$i" -gt "$maxi" ]; then
                maxi=$i
              fi
            done < <(tail -n $tailoffset $input)
          done
        done

        for i in $(seq 0 $maxi); do
          line=$i
          for TYPE in reification singletonproperties graphs implicitgraphs none; do
            value=${matrix[$i,$TYPE]}
            count=${matrix[$i,$TYPE,count]}
            if ! [[ $value =~ $re ]]; then
              # makes sure the point isn't drawn
              value="a"
            else
              if ! $CUMULATIVE; then
                value=$(echo "scale=2;$value / $count" | bc -l)
              fi
            fi
            line=$line" "$value
          done
          echo $line >> $data
        done
        dirout="output/plots/cumulative-"$CUMULATIVE"/rewriting-"$REWRITING
        mkdir -p $dirout
        file=$dirout"/"$dir"_interval-"$INTERVAL"_caching-"$CACHING".png"
        gnuplot plotTrainTests.gplot > $file
      done
    done
  done
done
