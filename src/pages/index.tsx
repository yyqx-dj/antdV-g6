import React, { useState, useEffect } from 'react';
import G6 from '@antv/g6';
import { Button, Row, Col } from 'antd';
import { data } from './config';
import './index.less';
import Left from './Left';
import { nanoid } from 'nanoid';
import EditModal from './component/EditModal';
let graph = null;

export default function index() {
  const [data1, setData1] = useState({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [item, setItem] = useState('');
  const [leftMenu, setLeftMenu] = useState([
    {
      id: 1,
      value: '节点1',
      type: 'rect',
    },
    {
      id: 2,
      value: '节点2',
      type: 'rect',
    },
    {
      id: 3,
      value: '节点3',
      type: 'rect',
    },
    {
      id: 4,
      value: '节点4',
      type: 'rect',
    },
  ]);
  const processParallelEdgesOnAnchorPoint = (
    edges,
    offsetDiff = 15,
    multiEdgeType = 'quadratic',
    singleEdgeType = undefined,
    loopEdgeType = undefined,
  ) => {
    const len = edges.length;
    const cod = offsetDiff * 2;
    const loopPosition = [
      'top',
      'top-right',
      'right',
      'bottom-right',
      'bottom',
      'bottom-left',
      'left',
      'top-left',
    ];
    const edgeMap = {};
    const tags = [];
    const reverses = {};
    for (let i = 0; i < len; i++) {
      const edge = edges[i];
      const { source, target, sourceAnchor, targetAnchor } = edge;
      const sourceTarget = `${source}|${sourceAnchor}-${target}|${targetAnchor}`;

      if (tags[i]) continue;
      if (!edgeMap[sourceTarget]) {
        edgeMap[sourceTarget] = [];
      }
      tags[i] = true;
      edgeMap[sourceTarget].push(edge);
      for (let j = 0; j < len; j++) {
        if (i === j) continue;
        const sedge = edges[j];
        const {
          source: src,
          target: dst,
          sourceAnchor: srcAnchor,
          targetAnchor: dstAnchor,
        } = sedge;

        // 两个节点之间共同的边
        // 第一条的source = 第二条的target
        // 第一条的target = 第二条的source
        if (!tags[j]) {
          if (
            source === dst &&
            sourceAnchor === dstAnchor &&
            target === src &&
            targetAnchor === srcAnchor
          ) {
            edgeMap[sourceTarget].push(sedge);
            tags[j] = true;
            reverses[
              `${src}|${srcAnchor}|${dst}|${dstAnchor}|${
                edgeMap[sourceTarget].length - 1
              }`
            ] = true;
          } else if (
            source === src &&
            sourceAnchor === srcAnchor &&
            target === dst &&
            targetAnchor === dstAnchor
          ) {
            edgeMap[sourceTarget].push(sedge);
            tags[j] = true;
          }
        }
      }
    }

    for (const key in edgeMap) {
      const arcEdges = edgeMap[key];
      const { length } = arcEdges;
      for (let k = 0; k < length; k++) {
        const current = arcEdges[k];
        if (current.source === current.target) {
          if (loopEdgeType) current.type = loopEdgeType;
          // 超过8条自环边，则需要重新处理
          current.loopCfg = {
            position: loopPosition[k % 8],
            dist: Math.floor(k / 8) * 20 + 50,
          };
          continue;
        }
        if (
          length === 1 &&
          singleEdgeType &&
          (current.source !== current.target ||
            current.sourceAnchor !== current.targetAnchor)
        ) {
          current.type = singleEdgeType;
          continue;
        }
        current.type = multiEdgeType;
        const sign =
          (k % 2 === 0 ? 1 : -1) *
          (reverses[
            `${current.source}|${current.sourceAnchor}|${current.target}|${current.targetAnchor}|${k}`
          ]
            ? -1
            : 1);
        if (length % 2 === 1) {
          current.curveOffset = sign * Math.ceil(k / 2) * cod;
        } else {
          current.curveOffset = sign * (Math.floor(k / 2) * cod + offsetDiff);
        }
      }
    }
    return edges;
  };
  //修改节点或连接线label
  const onEditNodeOrEdge = (value: any) => {
    const node = item;
    const model = node.getModel();
    model.oriLabel = model.label; //保存一下原始的label
    graph.updateItem(node, {
      label: value,
      labelCfg: {
        style: {
          fill: '#003a8c',
        },
      },
    });
  };
  const createNode = () => {
    //G6.registerNode(typeName: string, nodeDefinition: object, extendedTypeName?: string)
    //typeName：该新节点类型名称；
    //nodeDefinition：该新节点类型的定义，其中必要函数详见 自定义机制 API。当有 extendedTypeName 时，没被复写的函数将会继承 extendedTypeName 的定义
    //extendedTypeName：被继承的节点类型，可以是内置节点类型名，也可以是其他自定义节点的类型名。extendedTypeName 未指定时代表不继承其他类型的节点；
    G6.registerNode(
      'rect-node',
      {
        /**
         * 绘制后的附加操作，默认没有任何操作
         * @param  {Object} cfg 节点的配置项
         * @param  {G.Group} group 图形分组，节点中图形对象的容器
         */
        afterDraw(cfg, group) {
          /**
         * item.getBBox()
            获取元素的包围盒。

            返回值

            返回值类型：Object。
            返回值对象包括以下属性：

            名称	类型	描述
            x	number	视口 x 坐标
            y	number	视口 y 坐标
            width	number	bbox 宽度
            height	number	bbox 高度
            centerX	number	中心点 x 坐标
            centerY	number	中心点 y 坐标
         */
          const bbox = group.getBBox();
          const anchorPoints = this.getAnchorPoints(cfg); //获取锚点

          //循环创建锚点
          anchorPoints.forEach((anchorPos, i) => {
            //group.addShape(type, cfgs)  向分组中添加新的图形
            /*
           type	String  图元素类型，值可以为：'rect'、'circle'、'fan'、'ellipse'、'marker'、'image' 等，具体参考 Shape 的类型及属性 教程
           cfg	Object	图元素的属性
           其中，cfg 包括以下字段：
           attrs	Object	图形样式，必须配置，例如：{x: 0, y: 10, fill: '#0f0'}
           name	String	图形的标识，可以不唯一。在 G6 3.3 及以后版本中必须指定。另外，name 可以用于组内搜索到该元素：const shape = group.find(element => element.get('name') === 'shape-name')，find 函数用法见 find(fn)
           capture	Boolean	该图形是否可以被鼠标事件捕捉到，即是否能够响应各鼠标事件。非必须指定
           visible	Boolean	该图形是否可见。非必须指定，默认为 true
           draggable	Boolean	该图形是否允许被拖拽。例如，自定义节点通过 addShape 添加图形，当该图形的 draggable 值为 true 时，鼠标在该自定义节点的这个图形上才能够响应 dragstart，drag，与 dragend 事件；在实例化图时的 modes 中配置的 'drag-node' 交互才可以在该图形上进行拖拽时生效
           zIndex	Number	该图形的视觉层次 z-index。非必须指定。指定后，调用 group.sort() 可以对组内所有图形根据各自 zIndex 进行视觉层次的排序
          */
            group.addShape('circle', {
              attrs: {
                r: 5,
                x: bbox.x + bbox.width * anchorPos[0],
                y: bbox.y + bbox.height * anchorPos[1],
                fill: '#fff',
                stroke: '#5F95FF',
              },
              name: `anchor-point`, // the name, for searching by group.find(ele => ele.get('name') === 'anchor-point')
              anchorPointIdx: i, // flag the idx of the anchor-point circle
              links: 0, // cache the number of edges connected to this shape
              visible: false, // invisible by default, shows up when links > 1 or the node is in showAnchors state
              draggable: true, // allow to catch the drag events on this shape
            });
          });
        },

        //获取锚点
        getAnchorPoints(cfg) {
          return (
            cfg.anchorPoints || [
              [0, 0.5],
              [0.33, 0],
              [0.66, 0],
              [1, 0.5],
              [0.33, 1],
              [0.66, 1],
            ]
          );
        },
        /**
         * 响应节点的状态变化。
         * 在需要使用动画来响应状态变化时需要被复写，其他样式的响应参见下文提及的 [配置状态样式] 文档
         * @param  {String} name 状态名称
         * @param  {Object} value 状态值
         * @param  {Node} node 节点
         */
        setState(name, value, item) {
          if (name === 'showAnchors') {
            /**
           * item.getContainer()
              获取元素的容器。
              返回值
              返回值类型：G.Group；
              返回元素所在的 graphics group。
              用法
              // 获取元素的容器
              const group = item.getContainer();
              // 等价于
              const group = item.get('group');
           */
            /**
           * graph.findAll(type, fn)
                  查询所有满足规则的元素。
                  参数
                  名称	类型	是否必选	描述
                  type	string	true	元素类型，可选值为 'node'、'edge'
                  fn	Function	true	查找的规则
                  返回值
                  返回值类型：Array；
                  如果有符合规则的元素实例，则返回所有元素实例，否则返回 undefined。
                  用法
                  const nodes = graph.findAll('node', (node) => {
                  return node.get('model').x;
                  });
           */
            const anchorPoints = item
              .getContainer()
              .findAll((ele) => ele.get('name') === 'anchor-point');
            anchorPoints.forEach((point) => {
              if (value || point.get('links') > 0) point.show();
              else point.hide();
            });
          }
        },
      },
      'rect',
    );

    //需要注意的是，自定义节点/边时，若给定了 extendedTypeName，如 draw，update，setState 等必要的函数若不在 nodeDefinition 中进行复写，将会继承 extendedTypeName 中的相关定义。
  };
  useEffect(() => {
    const grid = new G6.Grid();
    const toolbar = new G6.ToolBar({
      position: { x: 10, y: 10 },
    });
    const contextMenu = new G6.Menu({
      getContent(evt) {
        let header;
        if (evt.target && evt.target.isCanvas && evt.target.isCanvas()) {
          header = 'Canvas ContextMenu';
        } else if (evt.item) {
          const itemType = evt.item.getType();
          header = `${itemType.toUpperCase()} 菜单`;
        }
        return `
                <h3>${header}</h3>
                <ul>
                  <li title='删除'>删除</li>
                  <li title='编辑'>编辑</li>
                </ul>`;
      },
      handleMenuClick: (target, item) => {
        console.log(target, item);
        if (target.title == '删除') {
          graph.removeItem(item);
        } else if (target.title == '编辑') {
          setItem(item);
          setIsModalVisible(true);
        }
      },
      // offsetX and offsetY include the padding of the parent container
      // 需要加上父级容器的 padding-left 16 与自身偏移量 10
      offsetX: 16 + 10,
      // 需要加上父级容器的 padding-top 24 、画布兄弟元素高度、与自身偏移量 10
      offsetY: 0,
      // the types of items that allow the menu show up
      // 在哪些类型的元素上响应
      itemTypes: ['node', 'edge', 'canvas'],
    });
    // 自定义节点
    createNode();
    /**
     * 边可以通过指定 sourceAnchor 和 targetAnchor  分别选择起始点、结束点的 anchorPoint。
     * sourceAnchor 和 targetAnchor 取的值是相对应节点上 anchorPoints 数组的索引值。
     */
    let sourceAnchorIdx, targetAnchorIdx;
    // const width = container.scrollWidth;
    // const height = (container.scrollHeight || 500) - 20;
    const width = 800;
    const height = 500;

    // console.log('=scrollWidth=',width)
    // console.log('=scrollHeight=',height)

    graph = new G6.Graph({
      container: 'mountNode',
      width,
      height,
      plugins: [grid, toolbar, contextMenu], // 将 grid 实例配置到图上
      // 设置为true，启用 redo & undo 栈功能
      enabledStack: true,
      defaultNode: {
        //节点默认的属性，包括节点的一般属性和样式属性（style）
        type: 'rect-node',
        style: {
          width: 200,
          fill: '#eee',
          stroke: '#ccc',
        },
      },
      defaultEdge: {
        //边默认的属性，包括边的一般属性和样式属性（style）
        type: 'polyline',
        style: {
          stroke: '#F6BD16',
          lineWidth: 2,
          endArrow: true, //箭头
        },
      },
      // 节点不同状态下的样式集合
      nodeStateStyles: {
        // 鼠标 hover 上节点，即 hover 状态为 true 时的样式
        hover: {
          fill: 'lightsteelblue',
        },
        // 鼠标点击节点，即 click 状态为 true 时的样式
        click: {
          stroke: '#000',
          lineWidth: 3,
          fill: 'lightsteelblue',
        },
      },
      edgeStateStyles: {
        selected: {
          lineWidth: 3,
          stroke: '#f00',
        },
      },
      modes: {
        default: [
          // {
          //     type: 'tooltip', //type: 'edge-tooltip'；边文本提示
          //     formatText(model) {
          //       return model.label;
          //     },
          //     offset: 10,
          //   },
          {
            type: 'click-select',
            trigger: 'ctrl',
            // 是否允许该 behavior 发生。若返回 false，被操作的 item 不会被选中，也不会触发 'nodeselectchange' 时机事件
            // shouldBegin: (e) => {
            //   // 当点击的图形名为 'text-shape' 时，不允许该 behavior 发生
            //   if (e.target.get('name') === 'text-shape') return false;
            //   // 当点击的节点/边/ combo 的 id 为 'id1' 时，不允许该 behavior 发生
            //   if (e.item.getModel().id === 'id1') return false;
            //   return true;
            // },
            // // 是否允许对该 behavior 发生状态响应。若返回 false，被操作的对象的状态及相关状态样式不会被更新，但是仍然会触发 'nodeselectchange' 时机事件
            // shouldUpdate: (e) => {
            //   // 当点击的节点/边/ combo 的 id 为 'id2' 时，该 item 不会发生状态的改变
            //   if (e.item.getModel().id === 'id2') return false;
            //   return true;
            // },
          },
          // config the shouldBegin for drag-node to avoid node moving while dragging on the anchor-point circles
          {
            type: 'drag-node',
            shouldBegin: (e) => {
              if (e.target.get('name') === 'anchor-point') return false;
              return true;
            },
          },
          // config the shouldBegin and shouldEnd to make sure the create-edge is began and ended at anchor-point circles
          {
            type: 'create-edge', //通过交互创建边；
            trigger: 'drag', //该交互的触发条件，可选 'click'，'drag'。默认为 'click'，即分别点击两个节点为这两个节点创建边。'drag' 代表从一个节点“拖拽”出一条边，在另一个节点上松开鼠标完成创建。注意，trigger: 'drag' 不能创建一个自环边；
            /*
              key：键盘按键作为该交互的辅助触发，若不设置或设置为 undefined 则代表只根据 trigger 决定该交互的触发条件。可选值：'shift'，'ctrl', 'control'，'alt'，'meta'，undefined；
              edgeConfig: 有该交互创建出的边的配置项，可以配置边的类型、样式等，其类型参考边的配置。如果需要为不同的被添加边赋予不同样式，请监听 'aftercreateedge' 并更新相对应的边；
            */

            shouldBegin: (e) => {
              //是否允许当前被操作的条件下开始创建边；
              if (e.target && e.target.get('name') !== 'anchor-point')
                return false;
              sourceAnchorIdx = e.target.get('anchorPointIdx');
              e.target.set('links', e.target.get('links') + 1); // cache the number of edge connected to this anchor-point circle
              return true;
            },
            shouldEnd: (e) => {
              //是否允许当前被操作的条件下结束创建边；
              // avoid ending at other shapes on the node
              if (e.target && e.target.get('name') !== 'anchor-point')
                return false;
              if (e.target) {
                targetAnchorIdx = e.target.get('anchorPointIdx');
                e.target.set('links', e.target.get('links') + 1); // cache the number of edge connected to this anchor-point circle
                return true;
              }
              targetAnchorIdx = undefined;
              return true;
            },
          },
        ],
      },
    });

    graph.data(data1);
    graph.render();

    /*
        时机事件
        用于监听图的某方法调用前后的时机。使用如下形式进行交互事件的监听：
        
        graph.on(timingEventName, evt => {
        // 一些操作
        })
    */
    // // 当 click-select 选中的元素集合发生变化时将会触发下面时机事件，e 中包含相关信息
    // graph.on('nodeselectchange', (e) => {
    //     // 当前操作的 item
    //     console.log(e.target);
    //     // 当前操作后，所有被选中的 items 集合
    //     console.log(e.selectedItems);
    //     // 当前操作时选中(true)还是取消选中(false)
    //     console.log(e.select);

    //     console.log(e.target.get('id'))
    //     if(e.select){

    //     }
    // });

    //使用内置交互 create-edge，创建边之后触发. 其参数 e 中的 edge 字段即为刚刚创建的边
    graph.on('aftercreateedge', (e) => {
      // update the sourceAnchor and targetAnchor for the newly added edge
      /*
          graph.updateItem(item, model, stack)  
          更新元素，包括更新数据、样式等。
          若图上有 combo，使用该函数更新一个节点位置后，需要调用 updateCombo(combo) 以更新相关 combo 的位置.

          item	string / Object	true	元素 ID 或元素实例
          model	Object	true	需要更新的数据模型，具体内容参见元素配置项
          stack	boolean	false	操作是否入 undo & redo 栈，当实例化 Graph 时设置 enableStack 为 true 时，默认情况下会自动入栈，入栈以后，就支持 undo & redo 操作，如果不需要，则设置该参数为 false 即可
      */
      graph.updateItem(e.edge, {
        sourceAnchor: sourceAnchorIdx, //边的起始节点上的锚点的索引值。
        targetAnchor: targetAnchorIdx, //边的终止节点上的锚点的索引值。
      });

      // update the curveOffset for parallel edges
      /*
        graph.save() 获取图数据。
        返回值类型：Object；
        返回值包括所有节点和边，数据结构如下下所示：
        {
          nodes: [],
          edges: [],
          groups:[],
        }
      */

      const edges = graph.save().edges;
      // processParallelEdgesOnAnchorPoint(edges);
      /**
       * graph.getEdges() 获取图中所有边的实例。
       * ⚠️ 注意: 这里返回的是边的实例，而不是边的数据项。
       * 返回值
          返回值类型：Array；
          返回值表示图中所有边的实例。
       */
      graph.getEdges().forEach((edge, i) => {
        graph.updateItem(edge, {
          curveOffset: edges[i].curveOffset, //curveOffset 弧度
          curvePosition: edges[i].curvePosition, //控制点在两端点连线上的相对位置，范围 0 ～ 1
        });
      });
    });

    // after drag from the first node, the edge is created, update the sourceAnchor
    //调用 graph.add / graph.addItem 方法之后触发
    // graph.on('afteradditem', e => {
    //   /**
    //    * item.getType()
    //     获取元素的类型。
    //     返回值
    //     返回值类型：String；
    //     返回元素的类型，可能是 'node' 或 'edge'。
    //     用法
    //     // 获取元素的类型
    //     const type = item.getType();
    //     // 等价于
    //     const type = item.get('type');
    //    */
    //   if (e.item && e.item.getType() === 'edge') {
    //     graph.updateItem(e.item, {
    //       sourceAnchor: sourceAnchorIdx
    //     });
    //   }
    // })

    // if create-edge is canceled before ending, update the 'links' on the anchor-point circles
    //调用 graph.remove / graph.removeItem 方法之后触发
    graph.on('afterremoveitem', (e) => {
      if (e.item && e.item.source && e.item.target) {
        const sourceNode = graph.findById(e.item.source);
        const targetNode = graph.findById(e.item.target);
        const { sourceAnchor, targetAnchor } = e.item;
        if (sourceNode && !isNaN(sourceAnchor)) {
          const sourceAnchorShape = sourceNode
            .getContainer()
            .find(
              (ele) =>
                ele.get('name') === 'anchor-point' &&
                ele.get('anchorPointIdx') === sourceAnchor,
            );
          sourceAnchorShape.set('links', sourceAnchorShape.get('links') - 1);
        }
        if (targetNode && !isNaN(targetAnchor)) {
          const targetAnchorShape = targetNode
            .getContainer()
            .find(
              (ele) =>
                ele.get('name') === 'anchor-point' &&
                ele.get('anchorPointIdx') === targetAnchor,
            );
          targetAnchorShape.set('links', targetAnchorShape.get('links') - 1);
        }
      }
    });

    /**
     * graph.setItemState(item, state, value)
    设置元素状态。支持单个状态多值的情况，详情参考 G6 状态管理最佳实践。

    该方法在执行过程中会触发 beforitemstatechange，afteritemstatechange 事件。

    参数

    名称	类型	是否必选	描述
    item	string / Item	true	元素 ID 或元素实例
    state	string	true	状态值，支持自定义，如 selected、hover、actived 等。
    value	Boolean / string	true	是否启用状态

    */
    // graph.on('click', (ev) => {
    //     const shape = ev.target;
    //     const item = ev.item;
    //     if (item) {
    //         // const type = item.getType();
    //         // if(type=='edge'){

    //         // }else if(type=='node'){
    //         //     console.log(item?.get('id'))
    //         // }
    //         const item = graph.findById(item?.get('id'));
    //         graph.removeItem(item);
    //       }

    //   });

    // 点击边
    // graph.on('edge:click', (e) => {
    //   const nodeItem = e.item; // 获取被点击的节点元素对象

    // });
    // 点击节点
    // graph.on('node:click', (e) => {
    //   // 先将所有当前是 click 状态的节点置为非 click 状态
    //   // const clickNodes = graph.findAllByState('node', 'click');
    //   // clickNodes.forEach((cn) => {
    //   // graph.setItemState(cn, 'click', false);
    //   // });
    //   const nodeItem = e.item; // 获取被点击的节点元素对象

    // });
    // some listeners to control the state of nodes to show and hide anchor-point circles
    //鼠标移入节点时触发
    graph.on('node:mouseenter', (e) => {
      graph.setItemState(e.item, 'showAnchors', true);
    });
    //鼠标移出节点时触发
    graph.on('node:mouseleave', (e) => {
      graph.setItemState(e.item, 'showAnchors', false);
    });
    //当拖曳节点进入目标元素的时候触发的事件，此事件作用在目标元素上
    graph.on('node:dragenter', (e) => {
      graph.setItemState(e.item, 'showAnchors', true);
    });
    //当拖曳节点离开目标元素的时候触发的事件，此事件作用在目标元素上
    graph.on('node:dragleave', (e) => {
      graph.setItemState(e.item, 'showAnchors', false);
    });
    //当节点开始被拖拽的时候触发的事件，此事件作用在被拖曳节点上
    graph.on('node:dragstart', (e) => {
      graph.setItemState(e.item, 'showAnchors', true);
    });
    graph.on('node:dragout', (e) => {
      graph.setItemState(e.item, 'showAnchors', false);
    });
  }, []);

  const onSave = () => {
    console.log(graph.save());
  };
  const onAdd = () => {
    const model = {
      id: nanoid(),
      label: nanoid(),
      address: 'cq',
      x: 200 + Math.random() * 100,
      y: 200 + Math.random() * 100,
    };

    graph.addItem('node', model);
  };

  const onDragEnd = (e: any) => {
    console.log(e.target);
    console.log(e);
    const model = {
      id: nanoid(),
      label: e.target.innerHTML,
      address: 'cq',
      x: e.pageX,
      y: e.pageY,
      // anchorPoints: [[0, 0.5], [0.33, 0], [0.66, 0], [1, 0.5], [0.33, 1], [0.66, 1]]
    };

    graph.addItem('node', model);
  };
  return (
    <div>
      <>
        <Row>
          <Col style={{ padding: '10px' }}>
            {leftMenu.map((item: any) => {
              return (
                <div
                  key={item.id}
                  className={item.type}
                  draggable="true"
                  onDragEnd={onDragEnd}
                >
                  {item.value}
                </div>
              );
            })}

            {/* <Left /> */}
          </Col>
          <Col>
            <div id="mountNode"></div>
          </Col>
        </Row>

        <Button onClick={onSave}>保存</Button>
        <Button onClick={onAdd}>添加</Button>

        <EditModal
          item={item}
          isModalVisible={isModalVisible}
          setIsModalVisible={setIsModalVisible}
          onEditNodeOrEdge={onEditNodeOrEdge}
        />
      </>
    </div>
  );
}
