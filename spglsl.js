import fs from "fs";
import { spglslAngleCompile } from 'spglsl'

async function compileFile() {
  const result = await spglslAngleCompile({
    mainFilePath: process.argv[2],
    mainSourceCode: fs.readFileSync(process.argv[2], 'utf8'),
    minify: true
  })

  if (!result.valid) {
    console.log(result.infoLog)
    throw new Error('compilation failed')
  }

  return result.output
}

console.log(compileFile());