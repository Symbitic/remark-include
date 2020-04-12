const path = require('path')
const tap = require('tap')
const remark = require('remark')
const VFile = require('to-vfile')

const include = require('../index')
const processor = remark().use(include)

const map = {
  '@include a.md': '# A',
  '@include a': '# A',
  '@include b': '# B',
  '@include sub/sub': '# A\n\n# sub'
}

function transform (lines) {
  return lines
    .map(function (line) { return map[line] || line })
    .filter(function (v) { return !!v })
    .join('\n\n') + '\n'
}

function loadFile (file) {
  return VFile.readSync(path.join(__dirname, file), {encoding: "utf-8"})
}


tap.test('should include by exact path', function (t) {
  const file = loadFile('exact.md')
  var expected = transform(file.contents.split('\n'))
  t.equal(processor.processSync(file).toString(), expected)
  t.end()
})

tap.test('should include by guessing extension', function (t) {
  const file = loadFile('guess.md')
  const expected = transform(file.contents.split('\n'))
  t.equal(processor.processSync(file).toString(), expected)
  t.end()
})

tap.test('should include from sub and super paths', function (t) {
  const file = loadFile('super.md')
  const expected = transform(file.contents.split('\n'))
  t.equal(processor.processSync(file).toString(), expected)
  t.end()
})

tap.test('should fail to include non-existent file', function (t) {
  t.throws(
    function () { processor.processSync('@include nope.md').toString() },
    'Unable to include ' + path.join(process.cwd(), 'nope.md')
  )
  t.end()
})
