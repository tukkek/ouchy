#!/bin/bash
echo building
echo '//controller.js' > out.js
echo >> out.js
cat controller.js >> out.js
echo >> out.js
echo "//TolZ LWG AI.js" >> out.js
cat "TolZ LWG AI.js" >> out.js
echo >> out.js
echo '//buildings.js' >>out.js
cat buildings.js >>out.js
echo >> out.js
echo '//building.js' >>out.js
cat building.js >>out.js
echo >> out.js
echo '//economy.js' >>out.js
cat economy.js >>out.js
echo >> out.js
echo '//army.js' >>out.js
cat army.js >>out.js
echo >> out.js
echo '//ouchy.js' >>out.js
cat ouchy.js >>out.js
exit