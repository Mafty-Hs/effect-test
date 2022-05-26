import { Injectable } from '@angular/core';
import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer.js'
import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera.js';
import { Scene } from 'three/src/scenes/Scene.js';
import { Clock } from 'three/src/core/Clock.js';
import { Vector3 } from 'three/src/math/Vector3.js';

interface EffectData {
      time: number;
      file: string;
      position: string;
      size: number;
}

interface RenderData {
      identifier: string;
      canvas: HTMLCanvasElement;
      renderer: WebGLRenderer;
      camera: PerspectiveCamera;
      clock:Clock;
      scene: Scene;
      context : effekseer.EffekseerContext;
      timer?: NodeJS.Timer;
      effect: {[key: string]: effekseer.EffekseerEffect}
}


@Injectable({
  providedIn: 'root'
})

export class EffectService {

  canEffect : boolean = true;
  renderers:RenderData[] = [];


  async play(rect :DOMRect, effectName :string, is3d :boolean) {
    if (!this.canEffect || (is3d && !this.isValid(rect))) return;
    let width,height,top,left: number;
    [width,height,top,left] = is3d ? this.calcSize3d(rect,effectName) : this.calcSize2d(rect,effectName);
    let identifier = Math.random().toString(32).substring(2);
    let renderer:RenderData =  this.generateRenderer(top,left,width,height, is3d);
    renderer.identifier = identifier;
    await this.setEffect(renderer ,effectName);
    this.renderers.push(renderer);
    let position = Position[EffectInfo[effectName].position];
    renderer.context.play(renderer.effect[effectName],position.x,position.y,position.z);
    setTimeout(()=> this.stop(identifier) , EffectInfo[effectName].time + 1000 );
  }

  stop(identifier :string) {
    let renderer = this.renderers.find(renderer => renderer.identifier === identifier);
    if (renderer) {
      this.renderers = this.renderers.filter(renderer => renderer.identifier !== identifier);
      renderer.canvas.style.display = 'none';
      renderer.timer = null;
      renderer.identifier == "";
      document.body.removeChild(renderer.canvas);
      setTimeout(() => this.clear(renderer) ,500);
    }
  }

  clear(renderer :RenderData) {
    renderer.renderer.dispose();
    renderer.camera = null;
    renderer.clock = null;
    renderer.scene = null;
    renderer.context = null;
    renderer.effect = null;
    renderer.renderer.forceContextLoss();
    renderer.renderer.context = null;
    renderer.renderer.domElement = null;
    renderer.renderer = null;
    renderer.canvas.remove();
    renderer.canvas = null;
  }

  generateRenderer(top :number,left :number,width :number,height :number, is3d:boolean):RenderData {
    let canvas = document.createElement('canvas');
    canvas.style.pointerEvents = 'none';
    canvas.style.top = top + 'px';
    canvas.style.left = left + 'px';
    canvas.style.height = height + 'px';
    canvas.style.width = width + 'px';
    canvas.style.zIndex = is3d ? "20" : "1000002";
    canvas.style.position = "absolute";
    document.body.appendChild(canvas);
    let camera = new PerspectiveCamera(30.0, 1, 1, 1000);
    let context = null;
    if (is3d) {
      camera.position.set(20, 20, 20);
      camera.lookAt(new Vector3(0, 1, 0));
    }
    else {
      camera.position.set(0, 10, 30);
      camera.lookAt(new Vector3(0, 2, 0));
    }
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    let renderer = new WebGLRenderer({ canvas: canvas, alpha: true });
    renderer.setSize(width, height);
    return {identifier: "" ,canvas: canvas, renderer: renderer, camera: camera,clock: new Clock() ,scene: new Scene(), context: context,effect: {} };
  }

  get effectName() {
    return Object.keys(EffectInfo) as string[];
  }

  isValid(rect: DOMRect) :boolean {
    if
    (  rect.right < 1
    || rect.left < 1
    || rect.top < 1
    || rect.bottom < 1
    ) return false;
    return true;
  }

  calcSize3d(rect: DOMRect , effectName:string) :number[] {
    let size:number = EffectInfo[effectName].size;
    let baseWidth = (rect.bottom - rect.top);
    let baseHeight = (rect.right - rect.left);
    let width:number = this.validation(baseWidth * 2 * size);
    let height:number = this.validation(baseHeight * 2 * size);
    let top:number = rect.top - (height - baseHeight) / 2;
    let left:number = rect.left - (width - baseWidth) / 2;
    return [width,height,top,left]
  }

  calcSize2d(rect: DOMRect , effectName:string) :number[] {
    let size:number = EffectInfo[effectName].size;
    let baseWidth = (rect.bottom - rect.top);
    let baseHeight = (rect.right - rect.left);
    let width:number = baseHeight > baseWidth ? baseHeight * 1.2 : baseWidth * 1.2;
    let height:number = baseHeight > baseWidth ? baseHeight * 1.2 : baseWidth * 1.2;
    if (EffectInfo[effectName].position === 'area') {
      width *= 2.5;
      height *= 2.5;
    }
    let top:number = rect.top - (height - baseHeight) / 2;
    let left:number = rect.left - (width - baseWidth) / 2;
    return [width,height,top,left]
  }

  validation(number :number):number {
    if (number < 0) return 0;
    if (number > 800) return 800;
    return number;
  }


  mainLoop = () => {
    requestAnimationFrame(this.mainLoop.bind(this));
    for (let canvas of this.renderers) {
      canvas.context.update(canvas.clock.getDelta() * 60.0);
      canvas.renderer.render(canvas.scene, canvas.camera);
      canvas.context.setProjectionMatrix(Float32Array.from(canvas.camera.projectionMatrix.elements));
      canvas.context.setCameraMatrix(Float32Array.from(canvas.camera.matrixWorldInverse.elements));
      canvas.context.draw();
      canvas.renderer.resetState();
    }
  };

  private async setEffect(renderData :RenderData ,effectName :string):Promise<void> {
    renderData.context = effekseer.createContext();
    renderData.context.init(renderData.renderer.getContext(), {
      instanceMaxCount: 2000,
      squareMaxCount: 8000,
    });
    renderData.context.setRestorationOfStatesFlag(false);
    if (!renderData.effect[effectName]) {
      return new Promise<void>((resolve, reject) => {
        renderData.effect[effectName]  = renderData.context.loadEffect(EffectInfo[effectName].file,1,
          () => {
            resolve()
          },
          () => {
            reject()
          }
        );
      });
    }
    else {
      return;
    }
  }

  initialize() {
    effekseer.initRuntime("./assets/lib/effekseer.wasm",
    () => {
      this.mainLoop();
    },
    () => {
    }
    );
  }

}

const Position:{[key: string]: {x:number ,y:number , z: number }} = {
  'head': {x: 0,y: 1,z: 0},
  'center': {x: 0,y: 0,z: 0} ,
  'foot': {x: 0,y: -2,z: 0},
  'area': {x: 0,y: -2,z: 0},
}

const EffectInfo:{[key: string]: EffectData} = {
  '氷': {time: 2000, file: "assets/effect/ice.efk",size: 1,position: 'foot'},
}
