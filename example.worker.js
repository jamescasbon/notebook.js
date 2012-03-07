importScripts('/ext/sylvester.js');
importScripts('/lib/json2.js');
print('hi');


var V1 = $V([3,4,5]);
var V2 = $V([9,-3,0]);

var d = V1.dot(V2);
print(d);

var c = V1.cross(V2);
print(c);

print('done');



req = new XMLHttpRequest();
req.open("GET", '/test.json', false);
req.send(null);
print('foo' + req.responseText + '.');
res = JSON.parse(req.responseText);
print(res["a"]);

