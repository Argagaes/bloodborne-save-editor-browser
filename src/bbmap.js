// Reads Yharnam Together BBMAP9 charts. The map stays in the browser.
export async function decodeBbMap(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (bytes.length < 32 || ![66,66,77,65,80,57,0,0].every((v,i)=>bytes[i]===v)) throw Error('This is not a supported BBMAP9 map.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width=view.getInt32(8,true), height=view.getInt32(12,true), x0=view.getFloat32(16,true), z1=view.getFloat32(20,true), ppm=view.getFloat32(24,true), size=view.getUint32(28,true);
  if(width<1 || height<1 || width>8192 || height>8192 || width*height>24000000 || !Number.isFinite(x0) || !Number.isFinite(z1) || !Number.isFinite(ppm) || ppm<=0 || !size || size>bytes.length-32) throw Error('The map header is invalid or too large.');
  if(typeof DecompressionStream === 'undefined') throw Error('This browser cannot decompress map files. Try a current Chromium-based browser.');
  const stream=new Blob([bytes.subarray(32,32+size)]).stream().pipeThrough(new DecompressionStream('deflate'));
  const reader=stream.getReader(), chunks=[];let length=0;const expected=width*height*4;
  for (;;) {const {value,done}=await reader.read();if(done)break;length+=value.length;if(length>expected){await reader.cancel();throw Error('The map image has an invalid size.');}chunks.push(value);}
  if(length!==expected)throw Error('The map image is incomplete.');
  const rgba=new Uint8ClampedArray(expected);let offset=0;for(const chunk of chunks){rgba.set(chunk,offset);offset+=chunk.length;}
  return {width,height,x0,z1,ppm,rgba};
}
export function mapPoint(chart, position) {
  return {x:(position[0]-chart.x0)*chart.ppm, y:(chart.z1-position[2])*chart.ppm};
}
