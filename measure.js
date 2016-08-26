var fs = require('fs');

var paths = [
    'blog3/grammar.ohm',
    'blog3/ast.js',
    'blog3/semantics.js'
];
var total = 0;
paths.forEach((path) => total += countFile(path) );
console.log('total is',total);

function countFile(path) {
    console.log("reading",path);
    var file = fs.readFileSync(path).toString();
    //console.log('chars = ', file.length);
    var lines = file.split('\n');
    console.log('lines = ', lines.length);

    var code = lines.filter(function (line) {
        //comments
        if (line.match(/^\s*\/\//)) return false;
        //whitespace
        if (line.match(/^\s*$/)) return false;
        // lines with just * in them
        if (line.match(/^\s*\*/)) return false;
        return true;
    });

    console.log('code lines = ',code.length);
    return code.length;
}
