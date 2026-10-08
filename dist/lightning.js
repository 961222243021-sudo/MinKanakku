/* Lightning shader adapted from React Bits, Copyright (c) 2026 David Haz.
   MIT + Commons Clause; full notice in REACTBITS-LICENSE.txt. */
(() => {
 'use strict';
 const canvas=document.getElementById('lightningCanvas');
 if(!canvas)return;
 let gl;try{gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:false,powerPreference:'low-power'})}catch{return}
 if(!gl)return;
 const vertexSource=`
      attribute vec2 aPosition;
      void main() {
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;
 const fragmentSource=`
      precision mediump float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform float uHue;
      uniform float uXOffset;
      uniform float uSpeed;
      uniform float uIntensity;
      uniform float uSize;
      
      #define OCTAVE_COUNT 8

      vec3 hsv2rgb(vec3 c) {
          vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0,4.0,2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
          return c.z * mix(vec3(1.0), rgb, c.y);
      }

      float hash11(float p) {
          p = fract(p * .1031);
          p *= p + 33.33;
          p *= p + p;
          return fract(p);
      }

      float hash12(vec2 p) {
          vec3 p3 = fract(vec3(p.xyx) * .1031);
          p3 += dot(p3, p3.yzx + 33.33);
          return fract((p3.x + p3.y) * p3.z);
      }

      mat2 rotate2d(float theta) {
          float c = cos(theta);
          float s = sin(theta);
          return mat2(c, -s, s, c);
      }

      float noise(vec2 p) {
          vec2 ip = floor(p);
          vec2 fp = fract(p);
          float a = hash12(ip);
          float b = hash12(ip + vec2(1.0, 0.0));
          float c = hash12(ip + vec2(0.0, 1.0));
          float d = hash12(ip + vec2(1.0, 1.0));
          
          vec2 t = smoothstep(0.0, 1.0, fp);
          return mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
      }

      float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int i = 0; i < OCTAVE_COUNT; ++i) {
              value += amplitude * noise(p);
              p *= rotate2d(0.45);
              p *= 2.0;
              amplitude *= 0.5;
          }
          return value;
      }

      void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
          vec2 uv = fragCoord / iResolution.xy;
          uv = 2.0 * uv - 1.0;
          uv.x *= iResolution.x / iResolution.y;
          uv.x += uXOffset;
          
          uv += 2.0 * fbm(uv * uSize + 0.8 * iTime * uSpeed) - 1.0;
          
          float dist = abs(uv.x);
          vec3 baseColor = hsv2rgb(vec3(uHue / 360.0, 0.7, 0.8));
          vec3 col = baseColor * pow(mix(0.0, 0.07, hash11(iTime * uSpeed)) / max(dist, 0.001), 1.0) * uIntensity;
          col = pow(col, vec3(1.0));
          float a = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
          fragColor = vec4(col, a);
      }

      void main() {
          mainImage(gl_FragColor, gl_FragCoord.xy);
      }
    `;
 function compile(source,type){const s=gl.createShader(type);if(!s)return null;gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);return null}return s}
 const vertex=compile(vertexSource,gl.VERTEX_SHADER),fragment=compile(fragmentSource,gl.FRAGMENT_SHADER);
 if(!vertex||!fragment)return;
 const program=gl.createProgram();if(!program)return;
 gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))return;
 gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
 const position=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
 const uniforms={};['iResolution','iTime','uHue','uXOffset','uSpeed','uIntensity','uSize'].forEach(name=>uniforms[name]=gl.getUniformLocation(program,name));
 let frame=0,last=0,disposed=false;const started=performance.now();const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const enabled=()=>!disposed&&!document.hidden&&document.documentElement.dataset.motion!=='off'&&!reduced.matches;
 function resize(){const scale=Math.min(1,1100/Math.max(window.innerWidth,1));const width=Math.max(1,Math.round(window.innerWidth*scale)),height=Math.max(1,Math.round(window.innerHeight*scale));if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height}gl.viewport(0,0,width,height)}
 function clear(){gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT)}
 function render(now){frame=0;if(!enabled()){clear();return}frame=requestAnimationFrame(render);if(now-last<1000/24)return;last=now;resize();
  const elapsed=(now-started)/1000,cycle=elapsed%5;
  // One smooth electrical surge every five seconds, rather than a page-wide strobe.
  const pulse=cycle<1.3?Math.pow(Math.sin(Math.PI*cycle/1.3),2):0;
  const light=document.documentElement.dataset.theme==='light';
  gl.uniform2f(uniforms.iResolution,canvas.width,canvas.height);gl.uniform1f(uniforms.iTime,elapsed);
  gl.uniform1f(uniforms.uHue,light?228:238);gl.uniform1f(uniforms.uXOffset,window.innerWidth<700?-0.52:-1.05);
  gl.uniform1f(uniforms.uSpeed,0.55);gl.uniform1f(uniforms.uIntensity,(light?0.48:0.85)*pulse);gl.uniform1f(uniforms.uSize,1.15);
  gl.drawArrays(gl.TRIANGLES,0,6);
 }
 function sync(){if(!enabled()){if(frame)cancelAnimationFrame(frame);frame=0;clear()}else if(!frame)frame=requestAnimationFrame(render)}
 const observer=new MutationObserver(sync);observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-motion','data-theme']});
 document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);window.addEventListener('resize',resize);
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();disposed=true;if(frame)cancelAnimationFrame(frame);frame=0});
 window.addEventListener('pagehide',()=>{disposed=true;if(frame)cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',sync);reduced.removeEventListener('change',sync);window.removeEventListener('resize',resize);gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(vertex);gl.deleteShader(fragment)},{once:true});
 resize();sync();
})();
