import * as THREE from './three'

export default class FileLoader {

    load(url, resolve, onProgress, reject) {
        wx.request({
            url: url, //仅为示例，并非真实的接口地址
            responseType: "arraybuffer",
            success(res) {
                resolve(res.data)
            },
            fail(res) {
                console.error(url ,JSON.stringify(res));
                reject(res);
            }
        })
    }
}

class ImageLoader{
    load (canvas,url,onLoad,onProgress,onError ) {
        if ( url === undefined ) url = '';
        if ( this.path !== undefined ) url = this.path + url;
        var scope = this;
        var image = canvas.createImage();
        image.addEventListener( 'load', function () {
            if ( onLoad ) onLoad( this );
        }, false );

        /*
        image.addEventListener( 'progress', function ( event ) {

            if ( onProgress ) onProgress( event );

        }, false );
        */
        image.addEventListener( 'error', function ( event ) {
            if ( onError ) onError( event );
        }, false );
        image.src = url;
        return image;

    }
}


export class TextureLoader {

    load(canvas,url,onLoad,onProgress,onError ) {
        var texture = new THREE.Texture();
        var loader = new ImageLoader(  );
        loader.load(canvas, url, function ( image ) {
            texture.image = image;
            // JPEGs can't have an alpha channel, so memory can be saved by storing them as RGB.
            var isJPEG = url.search( /\.(jpg|jpeg)$/ ) > 0 || url.search( /^data\:image\/jpeg/ ) === 0;
            texture.format = isJPEG ? THREE.RGBFormat : THREE.RGBAFormat;
            texture.needsUpdate = true;
            if ( onLoad !== undefined ) {
                onLoad( texture );
            }
        }, onProgress, onError );
        return texture;
    }
}


export class DataTextureLoader {
    load(url, onLoad, onProgress, onError) {
        var scope = this;
        var texture = new THREE.DataTexture();
        var loader = new FileLoader();
        loader.load(url, function (buffer) {

            console.log("DataTextureLoader:",url);
            var data = new Uint8Array(buffer);
            var texData = new THREE.DataTexture(data, 1024,1024, THREE.RGBAFormat);
          
            wx.arrayBufferToBase64(res.data)

            if (!texData) return;

            if (undefined !== texData.image) {

                texture.image = texData.image;

            } else if (undefined !== texData.data) {

                texture.image.width = texData.width;
                texture.image.height = texData.height;
                texture.image.data = texData.data;

            }

            texture.wrapS = undefined !== texData.wrapS ? texData.wrapS : ClampToEdgeWrapping;
            texture.wrapT = undefined !== texData.wrapT ? texData.wrapT : ClampToEdgeWrapping;

            texture.magFilter = undefined !== texData.magFilter ? texData.magFilter : LinearFilter;
            texture.minFilter = undefined !== texData.minFilter ? texData.minFilter : LinearMipMapLinearFilter;

            texture.anisotropy = undefined !== texData.anisotropy ? texData.anisotropy : 1;

            if (undefined !== texData.format) {

                texture.format = texData.format;

            }
            if (undefined !== texData.type) {

                texture.type = texData.type;

            }

            if (undefined !== texData.mipmaps) {

                texture.mipmaps = texData.mipmaps;

            }

            if (1 === texData.mipmapCount) {

                texture.minFilter = LinearFilter;

            }

            texture.needsUpdate = true;

            if (onLoad) onLoad(texture, texData);

        }, onProgress, onError);


        return texture;

    }
}