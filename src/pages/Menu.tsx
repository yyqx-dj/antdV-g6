import React from 'react';
import { Menu, Switch, Divider } from 'antd';
const { SubMenu } = Menu;

export default function Menu() {
  return (
      <div className='menu'>
      <Menu>
        <Menu.Item>菜单项</Menu.Item>
        <SubMenu title="子菜单">
        <Menu.Item>子菜单项</Menu.Item>
        </SubMenu>
    </Menu>
      </div>
    
  )
}
