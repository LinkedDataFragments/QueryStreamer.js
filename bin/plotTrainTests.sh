#!/bin/zsh
re='^[0-9]+$'

mkdir -p plots
dirs=$*

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
        data=".train.data"
        echo "Duration Reification Singletonproperties Graphs Implicitgraphs Naieve" > $data
        maxi=0
        for TYPE in reification singletonproperties graphs implicitgraphs none; do
          #echo $TYPE
          dircount=0
          for dir in $dirs; do
            let "dircount++"
            if [[ "$TYPE" == "none" ]]; then
              input="$dir/naieve-$NAIEVEFREQ.txt"
            else
              input="$dir/annotation-"$TYPE"_interval-"$INTERVAL"_caching-"$CACHING".txt"
            fi
            i=0
            while read fline; do
              value=${matrix[$i,$TYPE]}
              if ! [[ $value =~ $re ]]; then
                if $CUMULATIVE && [ $i -gt 0 ]; then
                  value=${matrix[$(echo "$i - 1" | bc -l),$TYPE]}
                else
                  value="0"
                fi
              fi
              matrix[${i},${TYPE}]=$(echo "$fline + $value" | bc -l)
              #echo "$fline + $value = ${matrix[$i,$TYPE]}"
              if [ "$i" -gt "$maxi" ]; then
                maxi=$i
              fi
              let "i++"
            done < <(tail -n $tailoffset $input)
          done
        done

        for i in $(seq 0 $maxi); do
          line=$i
          for TYPE in reification singletonproperties graphs implicitgraphs none; do
            value=${matrix[$i,$TYPE]}
            if ! [[ $value =~ $re ]]; then
              # makes sure the point isn't drawn
              value="a"
            else
              value=$(echo "scale=2;$value / $dircount" | bc -l)
            fi
            line=$line" "$value
          done
          echo $line >> $data
        done
        file="plots/"$dir"_cumulative-"$CUMULATIVE"_interval-"$INTERVAL"_caching-"$CACHING"_rewriting-"$REWRITING".png"
        gnuplot plotTrainTests.gplot > $file
      done
    done
  done
done