import{S as e,T as t,d as n}from"./index-DnxDUS8C.js";import{a as r,d as i,l as a,n as o,o as s,s as c}from"./react-three-fiber.esm-CHuyYVTs.js";import{t as l}from"./disposal-BK3JTrKB.js";import{n as u,t as d}from"./field-CSjmkNHm.js";var f=t(e(),1),p=[`dust`,`field`,`type`,`structure`,`terrain`,`fracture`],m={dust:`DUST`,field:`FIELD`,type:`TYPE`,structure:`STRUCTURE`,terrain:`TERRAIN`,fracture:`FRACTURE`},h={dust:`Unformed. The material before anyone has decided anything.`,field:`The sheet, flat. Every particle on the same plane.`,type:`The wordmark, sampled from the real glyphs.`,structure:`The Compiler’s planes, separated in depth.`,terrain:`The specimen plate’s contour field, as height.`,fracture:`The same matter, thrown. Nothing is lost, only scattered.`};function g(e,t){let n=e*374761393+t*668265263>>>0;return n=(n^n>>>13)>>>0,n=Math.imul(n,1274126177)>>>0,((n^n>>>16)>>>0)/4294967296}function _(e,t){let n=new Float32Array(e*3),r=document.createElement(`canvas`);r.width=512,r.height=160;let i=r.getContext(`2d`,{willReadFrequently:!0}),a=[];if(i){i.fillStyle=`#fff`,i.font=`700 118px Rajdhani, Oswald, sans-serif`,i.textAlign=`center`,i.textBaseline=`middle`,i.fillText(`HI ANZY`,256,80);let e=i.getImageData(0,0,512,160).data;for(let t=0;t<160;t+=2)for(let n=0;n<512;n+=2)e[(t*512+n)*4+3]>128&&a.push([n/512-.5,.5-t/160])}a.length===0&&(a=[[0,0]]);for(let r=0;r<e;r++){let e=a[Math.floor(g(r,11)*a.length)],i=t*.004;n[r*3]=e[0]*t*1.5+(g(r,12)-.5)*i,n[r*3+1]=e[1]*t*.47+(g(r,13)-.5)*i,n[r*3+2]=(g(r,14)-.5)*t*.02}return n}function v(e,{count:t,spread:n}){let r=new Float32Array(t*3);switch(e){case`dust`:for(let e=0;e<t;e++){let t=g(e,1)**.62*n*.62,i=g(e,2)*Math.PI*2,a=Math.acos(g(e,3)*2-1);r[e*3]=t*Math.sin(a)*Math.cos(i),r[e*3+1]=t*Math.sin(a)*Math.sin(i)*.6,r[e*3+2]=t*Math.cos(a)*.5}return r;case`field`:{let e=Math.ceil(Math.sqrt(t*1.9)),i=Math.ceil(t/e);for(let a=0;a<t;a++){let t=a%e,o=Math.floor(a/e);r[a*3]=(t/(e-1)-.5)*n*1.5,r[a*3+1]=(o/Math.max(1,i-1)-.5)*n*.62,r[a*3+2]=0}return r}case`type`:return _(t,n);case`structure`:for(let e=0;e<t;e++){let t=e%6/5;r[e*3]=(g(e,21)-.5)*n*(1.15-t*.45),r[e*3+1]=(g(e,22)-.5)*n*.42,r[e*3+2]=-t*n*.85}return r;case`terrain`:{let{min:e,max:i}=u(64),a=i-e||1,o=Math.ceil(Math.sqrt(t));for(let i=0;i<t;i++){let t=i%o/o,s=Math.floor(i/o)/o,c=(d(t,s)-e)/a;r[i*3]=(t-.5)*n*1.6,r[i*3+1]=c*n*.42-n*.22,r[i*3+2]=(s-.5)*n*1.6}return r}case`fracture`:for(let e=0;e<t;e++){let t=g(e,31)*Math.PI*2,i=Math.acos(g(e,32)*2-1),a=n*(.55+g(e,33)*.85);r[e*3]=a*Math.sin(i)*Math.cos(t),r[e*3+1]=a*Math.sin(i)*Math.sin(t)*.7,r[e*3+2]=a*Math.cos(i)*.7}return r}}function y(e){let t=new Float32Array(e);for(let n=0;n<e;n++)t[n]=g(n,41)*.55;return t}function b(e){let t=new Float32Array(e);for(let n=0;n<e;n++)t[n]=g(n,51);return t}var x=n(),S=`
  attribute vec3 tFrom;
  attribute vec3 tTo;
  attribute float delay;
  attribute float seed;

  uniform float uProgress;
  uniform float uTime;
  uniform vec3  uPointer;
  uniform float uForce;
  uniform float uSize;
  uniform float uDrift;

  varying float vDepth;
  varying float vSeed;

  // Per-particle eased transition, staggered by delay so a state change sweeps.
  float staged(float p, float d) {
    float t = clamp((p - d) / max(0.0001, 1.0 - d), 0.0, 1.0);
    return t * t * (3.0 - 2.0 * t);
  }

  void main() {
    float t = staged(uProgress, delay);
    vec3 pos = mix(tFrom, tTo, t);

    // A small, slow breath so settled matter is not dead. Amplitude is tiny and
    // scales with the particle's own seed, so it never reads as noise.
    pos += vec3(
      sin(uTime * 0.35 + seed * 43.0),
      cos(uTime * 0.29 + seed * 71.0),
      sin(uTime * 0.23 + seed * 17.0)
    ) * uDrift * (0.4 + seed * 0.6);

    // Pointer force: inverse-square-ish falloff, clamped so nothing explodes.
    if (abs(uForce) > 0.001) {
      vec3 d = pos - uPointer;
      float dist = max(length(d), 1.0);
      float fall = clamp(180.0 / dist, 0.0, 1.6);
      pos += normalize(d) * fall * uForce * 60.0 * (0.6 + seed * 0.8);
    }

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    // Perspective-correct point size, with a floor so distant matter stays visible.
    gl_PointSize = max(1.0, uSize * (300.0 / max(1.0, -mv.z)));
    vDepth = clamp(-mv.z / 2600.0, 0.0, 1.0);
    vSeed = seed;
  }
`,C=`
  precision mediump float;
  varying float vDepth;
  varying float vSeed;
  uniform vec3 uNear;
  uniform vec3 uFar;

  void main() {
    // Round points, cheaply. No texture, no alpha atlas.
    vec2 c = gl_PointCoord - 0.5;
    if (dot(c, c) > 0.25) discard;
    vec3 col = mix(uNear, uFar, vDepth);
    float a = (0.55 + vSeed * 0.45) * (1.0 - vDepth * 0.55);
    gl_FragColor = vec4(col, a);
  }
`;function w({count:e,state:t,previous:n,progressRef:u,forceRef:d,spread:p,reduced:m}){let h=(0,f.useRef)(null),g=(0,f.useMemo)(()=>{let o=new r,s=v(n,{count:e,spread:p}),l=v(t,{count:e,spread:p});return o.setAttribute(`position`,new c(l.slice(),3)),o.setAttribute(`tFrom`,new c(s,3)),o.setAttribute(`tTo`,new c(l,3)),o.setAttribute(`delay`,new c(y(e),1)),o.setAttribute(`seed`,new c(b(e),1)),o.boundingSphere=new a(new i,p*3),o},[t,e,p]);l(g);let _=(0,f.useMemo)(()=>({uProgress:{value:0},uTime:{value:0},uPointer:{value:new i},uForce:{value:0},uSize:{value:1.7},uDrift:{value:m?0:3.2},uNear:{value:new s(`#f4ecd8`)},uFar:{value:new s(`#6d6a5e`)}}),[m]);return(0,f.useEffect)(()=>{h.current&&(h.current.uniforms.uDrift.value=m?0:3.2)},[m]),o((e,t)=>{let n=h.current;if(!n)return;n.uniforms.uProgress.value=u.current,n.uniforms.uTime.value+=Math.min(t,.05);let r=d.current;n.uniforms.uPointer.value.set(r.x,r.y,0),n.uniforms.uForce.value=r.sign}),(0,x.jsx)(`points`,{geometry:g,frustumCulled:!1,children:(0,x.jsx)(`shaderMaterial`,{ref:h,vertexShader:S,fragmentShader:C,uniforms:_,transparent:!0,depthWrite:!1,blending:1})})}export{p as i,m as n,h as r,w as t};