import React, { useState, useEffect } from 'react';
import G6 from '@antv/g6';
import { Button, Row, Col } from 'antd';
import { data } from './config';
import './index.less';
import Left from './Left';
import { nanoid } from 'nanoid';
import EditModal from './component/EditModal';
import img from '../assets/img/Kafka.png';
let graph = null;
G6.registerNode('rect-jsx', {
  jsx: (cfg) => `
    <group>
      <rect>
        <rect style={{
          width: 150,
          height: 20,
          fill: ${cfg.color},
          radius: [6, 6, 0, 0],
          cursor: 'crosshair',
          stroke: ${cfg.color}
        }} draggable="true" name='anchor_point'>
          <text style={{
            marginTop: 2,
            marginLeft: 75,
            textAlign: 'center',
            fontWeight: 'bold',
            fill: '#fff' }}>{{label}}</text>
        </rect>
        <rect 
        draggable="true"
        style={{
          width: 150,
          height: 55,
          cursor: 'move',
          stroke: ${cfg.color},
          fill: #ffffff,
          radius: [0, 0, 6, 6],
        }}>
          <text style={{ marginTop: 5, marginLeft: 4, fill: '#333' }}>描述: {{description}}</text>
          <text style={{ marginTop: 10, marginLeft: 4, fill: '#333' }}>创建者: {{meta.creatorName}}</text>
        </rect>
      </rect>
      <circle style={{
        stroke: ${cfg.color},
        r: 10,
        fill: '#fff',
        marginLeft: 75,
        cursor: 'pointer'
      }} name="circle">
        <image style={{ img: 'https://gw.alipayobjects.com/zos/antfincdn/FLrTNDvlna/antv.png', width: 12, height: 12,  marginLeft: 70,  marginTop: -5 }} />
      </circle>
    </group>`,
  afterDraw: (cfg, group) => {
    console.log(cfg);
    console.log(group);
  },
});
// const data = {
//   nodes: [
//     {
//       x: 150,
//       y: 150,
//       description: 'ant_type_name_...',
//       label: 'Type / ReferType',
//       color: '#2196f3',
//       meta: {
//         creatorName: 'a_creator',
//       },
//       id: 'test',
//       type: 'rect-xml',
//     },
//   ],
// };
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

  //修改节点或连接线label
  const onEditNodeOrEdge = (value: any) => {
    const node = item;
    console.log('node', node);
    const model = node.getModel();
    model.oriLabel = model.label; //保存一下原始的label
    graph.updateItem(node, {
      label: value,
      labelCfg: {
        style: {
          fill: '#003a8c',
        },
      },

      meta: {
        creatorName: value,
      },
    });
  };

  useEffect(() => {
    const data = {
      // nodes: [
      //   {
      //     x: 150,
      //     y: 150,
      //     description: 'ant_type_name_...',
      //     label: 'Type / ReferType',
      //     color: '#2196f3',
      //     meta: {
      //       creatorName: 'a_creator',
      //     },
      //     id: 'node1',
      //     type: 'rect-jsx',
      //   },
      //   {
      //     x: 350,
      //     y: 150,
      //     description: 'node2_name...',
      //     label: 'JSX Node',
      //     color: '#2196f3',
      //     meta: {
      //       creatorName: 'a_creator',
      //     },
      //     id: 'node2',
      //     type: 'rect-jsx',
      //   },
      // ],
      // edges: [{ source: 'node1', target: 'node2' }],
    };
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
    });
    graph = new G6.Graph({
      container: 'mountNode',
      width: 800,
      height: 800,
      plugins: [grid, toolbar, contextMenu], // 将 grid 实例配置到图上
      // 设置为true，启用 redo & undo 栈功能
      enabledStack: true,
      // translate the graph to align the canvas's center, support by v3.5.1
      // fitCenter: true,

      modes: {
        default: [
          // config the shouldBegin for drag-node to avoid node moving while dragging on the anchor-point circles
          {
            type: 'drag-node',
            shouldBegin: (e) => {
              console.log('节点-shouldBegin', e.target.get('name'));
              if (e.target.get('name') === 'anchor_point') return false;
              return true;
            },
          },
          // config the shouldBegin and shouldEnd to make sure the create-edge is began and ended at anchor-point circles
          {
            type: 'create-edge',
            trigger: 'drag', // set the trigger to be drag to make the create-edge triggered by drag
            shouldBegin: (e) => {
              console.log('边-shouldBegin', e.target.get('name'));
              // avoid beginning at other shapes on the node
              if (e.target.get('name') !== 'anchor_point') return false;
              return true;
            },
            shouldEnd: (e) => {
              console.log('边-shouldEnd', e);
              if (e.target.get('name') !== 'anchor_point') return false;

              return true;
            },
          },
          // 当按住 'alt' 键，并按下 'm' 键，将调用 graph.moveTo(10, 10)
          {
            type: 'shortcuts-call',
            // 主健
            trigger: 'control',
            // 副键
            combinedKey: 'm',
            // 将图内容的左上角移动到 10,10
            functionName: 'moveTo',
            functionParams: [50, 50],
          },
        ],
      },
      defaultEdge: {
        type: 'polyline',
        style: {
          stroke: '#F6BD16',
          lineWidth: 2,
          endArrow: true, //给连线加箭头
        },
      },
      // 在 G6 中，有三种方式配置不同状态的样式：
      //   在实例化 Graph 时，通过 nodeStateStyles 和 edgeStateStyles 对象定义；
      //   在节点/边数据中，在 stateStyles 对象中定义状态；
      //   在自定义节点/边时，在 options 配置项的 stateStyles 对象中定义状态。
      edgeStateStyles: {
        hover: {
          stroke: 'red',
          lineWidth: 2,
        },
      },
    });

    graph.data(data);
    graph.render();
    graph.on('aftercreateedge', (e) => {});
    graph.on('edge:mouseenter', (ev) => {
      const edge = ev.item;
      graph.setItemState(edge, 'hover', true);
    });

    graph.on('edge:mouseleave', (ev) => {
      const edge = ev.item;
      graph.setItemState(edge, 'hover', false);
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

  const onDragEnd = (e: any, value: any, img: any) => {
    console.log(e);
    const model = {
      x: e.pageX,
      y: e.pageY,
      description: 'ant_type_name_...',
      label: 'Type / ReferType',
      color: '#2196f3',
      meta: {
        creatorName: value,
      },
      id: nanoid(),
      type: 'rect-jsx',
      // name: 'anchor_point'
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
                  onDragEnd={(e) => onDragEnd(e, item.value, img)}
                >
                  <span>
                    <img src={img} alt="图片" />
                  </span>
                  <span>{item.value}</span>
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
