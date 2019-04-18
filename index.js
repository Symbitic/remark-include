/**
 * Remark plugin for including external files.
 */
const path = require('path')
const visit = require('unist-util-visit')
const VFile = require('to-vfile')

const parseInclude = /^@include (.*)(\n|$)/

function loadFile (cwd, vfile, filename) {
  // Add CWD, VFile dir, and VFile CWD
  const dirs = [ cwd ]
    .concat(vfile.history.length > 0
      ? path.dirname(vfile.history[vfile.history.length - 1])
      : ''
    )
    .concat(vfile.cwd)
    .filter(Boolean)
  
  // Create array of filenames
  const files = dirs
    .map(dir => [
      path.resolve(dir, filename),
      path.resolve(dir, filename + '.md'),
      path.resolve(dir, filename + '.markdown')
    ])
    .flat()

  const ret = files
    .map(name => {
      try {
        return VFile.readSync(name)
      } catch (e) {
        return false
      }
    })
    .filter(Boolean)

  if (ret.length < 1) {
    throw new Error('Unable to include ' + filename)
  }
  
  return ret[0]
}

function transformer (tree, file, cwd, processor) {
  visit(tree, [ 'text' ], (node, i, parent) => {
    if (!parseInclude.test(node.value)) {
      return
    }
    
    const [ , filename ] = node.value.match(parseInclude)
    
    const vfile = loadFile(cwd, file, filename)
    
    const root = processor.parse(vfile)
    
    // Recurse
    transformer(root, vfile, cwd, processor)

    const { children } = root
    
    parent.children.splice(i, 1, ...children)
  })
}

function include (options = {}) {
  const cwd = options.cwd || process.cwd()
  const processor = this

  return (tree, file) => {
    transformer(tree, file, cwd, processor)
  }
}

module.exports = include
