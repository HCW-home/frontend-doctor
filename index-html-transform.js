const fs = require('fs');
const node_path = require('path');

const addScript = (path)=>{
    return `<script type="module" src="${path}"></script>`
}
module.exports = (targetOptions, indexHtml) =>{
    const vendor_path = node_path.resolve(__dirname+`/dist/hug-at-home`);
    let vendorScripts = ``;
    fs.readdirSync(vendor_path).forEach((file)=>{
        if(file.indexOf('main-')===0){
                vendorScripts+=addScript(file);
        }
        console.log(file);
    });

    const mainScriptStr = `</body`;
    const mainIndex = indexHtml.indexOf(mainScriptStr);

    return `${indexHtml.slice(0,mainIndex)}
            ${vendorScripts}
            ${indexHtml.slice(mainIndex)}`;
}
