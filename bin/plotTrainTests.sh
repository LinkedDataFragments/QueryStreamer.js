#!/bin/zsh
re='^[0-9]+$'

dirs=$*

for INTERVAL in true false; do
  for CACHING in true false; do
    unset matrix
    typeset -A matrix
    data=".train.data"
    echo "Duration Reification Singletonproperties Graphs Implicitgraphs" > $data
    maxi=0
    for TYPE in reification singletonproperties graphs implicitgraphs; do
      dircount=0
      for dir in $dirs; do
        let "dircount++"
        input="$dir/annotation-"$TYPE"_interval-"$INTERVAL"_caching-"$CACHING".txt"
        i=0
        while read fline; do
          value=${matrix[$i,$TYPE]}
          if ! [[ $value =~ $re ]]; then value="0" ;fi
          matrix[${i},${TYPE}]=$(echo "$fline + $value" | bc -l)
          if [ "$i" -gt "$maxi" ]; then
            maxi=$i
          fi
          let "i++"
        done < <(tail -n +2 $input)
      done
    done

    for i in $(seq 1 $maxi); do
      line=$i
      for TYPE in reification singletonproperties graphs implicitgraphs; do
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
    file="plots/"$dir"-interval-"$INTERVAL"_caching-"$CACHING".png"
    mkdir -p plots
    gnuplot plotTrainTests.gplot > $file
  done
done
