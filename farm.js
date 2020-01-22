var workerFarm = require('worker-farm');
var workers    = workerFarm(require.resolve('./xml-parsing.js'))
var ret        = 0
 
for (var i = 0; i < 2; i++) {
  workers('#' + i + ' FOO', function (err, outp) {
    console.log(outp)
    if (++ret == 10)
      workerFarm.end(workers)
  })
}
