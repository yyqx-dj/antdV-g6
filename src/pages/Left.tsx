import React,{useEffect} from 'react'
import G6 from "@antv/g6";

export default function () {
    useEffect(()=>{
        const data = {
            nodes: [
              {
                id: "node1",
                // label: "Circle1",
                type: 'circle',       // 元素的图形
                size: 80,
                x: 30,
                y: 30
              },
              {
                id: "node2",
                // label: "Circle2",
                type: 'rect',       // 元素的图形
                size: [80,40],
                x: 30,
                y: 50
              }
            ],
            // edges: [
            //   {
            //     source: "node1",
            //     target: "node2"
            //   }
            // ]
          };
          
          const graph = new G6.Graph({
            container: "container",
            width: 200,
            height: 500,
            // fitView: true,
            defaultNode: {
            //   type: "circle",
            //   size: [18],
              color: "#5B8FF9",
              style: {
                fill: "#9EC9FF",
                lineWidth: 0
              },
            //   labelCfg: {
            //     style: {
            //       fill: "#fff",
            //       fontSize: 10
            //     }
            //   }
            },
            // defaultEdge: {
            //   style: {
            //     stroke: "#e2e2e2"
            //   }
            // }
          });
          
          graph.data(data);
          graph.render();
    },[])
  return (
    <div>
       <div id="container" style={{border: '1px solid black'}}/>
    </div>
  )
}
