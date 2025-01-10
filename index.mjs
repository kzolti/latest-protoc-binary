import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import unzipper from 'unzipper';
const getPlatform = (() => {
  const arch = process.arch;
  switch (process.platform) {
    case 'win32':
      return arch === 'x64' ? 'win64' : arch === 'ia32' ? 'win32' : 'unknown';
    case 'darwin':
      return arch === 'arm64' ? 'osx-aarch_64' : arch === 'x64' ? 'osx-x86_64' : 'osx-universal_binary';
    case 'linux':
      if (arch === 'x64') return 'linux-x86_64';
      if (arch === 'ia32') return 'linux-x86_32';
      if (arch === 'arm64') return 'linux-aarch_64';
      if (arch === 'ppc64') return 'linux-ppcle_64';
      if (arch === 's390x') return 'linux-s390_64';
      return 'unknown';
    default:
      return 'unknown';
  }
});
const downloadProtoc = async () => {
  const releasesUrl = 'https://api.github.com/repos/protocolbuffers/protobuf/releases/latest';
  
  try {
    const response = await fetch(releasesUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch releases: ${response.statusText}`);
    }
    const data = await response.json();
    const assets = data.assets;
    const platform=getPlatform();
    console.log(`Detected platform: ${platform}`);
    console.log('Available assets:', assets.map(asset => asset.name));

    const searchPattern = `protoc-${data.tag_name.replace(/^v/, '')}-${platform}`;
    console.log(`Search pattern: ${searchPattern}`);

    const asset = assets.find(asset => asset.name.includes(searchPattern));
    if (!asset) {
      console.error('No suitable asset found for your platform.');
      return;
    }

    const downloadUrl = asset.browser_download_url;
    console.log(`Download URL: ${downloadUrl}`);
    console.log(`Asset name: ${asset.name}`);

    const outputPath = path.join(process.cwd(), asset.name);

    const downloadResponse = await fetch(downloadUrl);
    if (!downloadResponse.ok) {
      throw new Error(`Failed to download asset: ${downloadResponse.statusText}`);
    }
    const fileStream = fs.createWriteStream(outputPath);
    downloadResponse.body.pipe(fileStream);

    fileStream.on('finish', async () => {
      console.log(`Downloaded ${asset.name} to ${outputPath}`);

      // Extract the ZIP file to the desired directory
      const binPath = path.join(process.cwd());
      console.log(`Extracting to ${binPath}...`);
      fs.mkdirSync(binPath, { recursive: true });

      fs.createReadStream(outputPath)
        .pipe(unzipper.Extract({ path: binPath }))
        .on('close', () => {
          console.log("move include to /bin/include");
          fs.rename("include", "bin/include",(err)=>{
            if (!err) {
              console.log(`remove ${outputPath}`)
              fs.unlink(outputPath,(err)=>{
                if(!err){

                }else{
                console.error(`${outputPath} file unlink error #7XUVX1`, err.message);
                }
              });
            } else {
              console.error(`Error in move dirctory: ${err.message} #enaKL4`);
            }
          });
          console.log(`Extracted files to ${binPath}`);
        })
        .on('error', (err) => {
          console.error(`Failed to extract files: ${err.message}`);
        });
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

downloadProtoc();
