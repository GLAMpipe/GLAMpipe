#!/bin/bash

echo $1
file=$1

# Get the header file out
header=$(head -1 $file)

echo $header
