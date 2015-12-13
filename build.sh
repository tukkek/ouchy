#!/bin/bash
while true
do
   ATIME=`stat -c %Z ouchy.js`
   if [[ "$ATIME" > "$LTIME" ]]
   then
      ./compile.sh
      LTIME=$ATIME
   fi
   ATIME=`stat -c %Z controller.js`
   if [[ "$ATIME" > "$LTIME" ]]
   then 
      ./compile.sh
      LTIME=$ATIME
   fi
   ATIME=`stat -c %Z buildings.js`
   if [[ "$ATIME" > "$LTIME" ]]
   then 
      ./compile.sh
      LTIME=$ATIME
   fi
   ATIME=`stat -c %Z building.js`
   if [[ "$ATIME" > "$LTIME" ]]
   then 
      ./compile.sh
      LTIME=$ATIME
   fi
   ATIME=`stat -c %Z "TolZ LWG AI.js"`
   if [[ "$ATIME" > "$LTIME" ]]
   then 
      ./compile.sh
      LTIME=$ATIME
   fi
   ATIME=`stat -c %Z economy.js`
   if [[ "$ATIME" > "$LTIME" ]]
   then 
      ./compile.sh
      LTIME=$ATIME
   fi
   ATIME=`stat -c %Z army.js`
   if [[ "$ATIME" > "$LTIME" ]]
   then 
      ./compile.sh
      LTIME=$ATIME
   fi
   sleep 1
done