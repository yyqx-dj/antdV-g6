import React,{useEffect} from 'react'
import {Modal,Form,Input,Button} from 'antd'

export default function (props: any) {
    const [form] = Form.useForm();

    useEffect(()=>{
        if(!props.isModalVisible){
            form.resetFields()
        }
    },[props.isModalVisible])
     
      const handleOk = () => {
          form.validateFields().then((res: any)=>{
            props.setIsModalVisible(false);
            props.onEditNodeOrEdge(res.content)
          }).catch((err: any)=>{
             console.log(err)
          })
       
      };
    
      const handleCancel = () => {
        props.setIsModalVisible(false);
      };

  return (
    <div>
    <Modal okText='确定' cancelText='取消' title={props.item?`修改${props.item.getType()}内容`:null} visible={props.isModalVisible} onOk={handleOk} onCancel={handleCancel}>
    <Form
      form={form}
      name="basic"
      labelCol={{ span: 5 }}
      wrapperCol={{ span: 16 }}
      initialValues={{ remember: true }}
      autoComplete="off"
      
    >
      <Form.Item
        label="内容"
        name="content"
        // rules={[{ required: true, message: 'Please input your username!' }]}
      >
        <Input />
      </Form.Item>
    </Form>
      </Modal>
    </div>
  )
}
