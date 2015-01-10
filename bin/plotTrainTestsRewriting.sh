#!/bin/zsh
re='^[0-9]+$'

dirs=$*

data=".train.data"
echo "Duration Reification Singletonproperties Graphs Implicitgraphs" > $data

for INTERVAL in true false; do
  for CACHING in true false; do
    unset matrix
    typeset -A matrix
    for TYPE in reification singletonproperties graphs implicitgraphs; do
      dircount=0
      for dir in $dirs; do
        let "dircount++"
        input="$dir/annotation-"$TYPE"_interval-"$INTERVAL"_caching-"$CACHING".txt"
        fline=$(head -1 $input)
        value=${matrix[$i,$TYPE]}
        if ! [[ $value =~ $re ]]; then value="0" ;fi
        matrix[${TYPE}]=$(echo "$fline + $value" | bc -l)
      done
    done

    line="I:"$INTERVAL"-C:"$CACHING
    for TYPE in reification singletonproperties graphs implicitgraphs; do
      value=${matrix[$TYPE]}
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
done

file="plots/"$dir"-rewriting.png"
gnuplot plotTrainTestsRewriting.gplot > $file
