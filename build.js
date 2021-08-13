const esbuild = require('esbuild');

esbuild.build({
	entryPoints: ['./src/prog.ts'],
	outfile: './bundle.js',
	platform: 'browser',
	bundle: true,
  loader: {".glsl":"text"},
  //minify: true,
  watch: {
    onRebuild(error, result) {
      if (error) console.error('watch build failed:', error)
      else console.log('watch build succeeded')
    },
  },	
}).then(result => {
  //result.stop()
})