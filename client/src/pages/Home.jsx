import {Card, Col, Row, Typography, FloatButton, Table, Space, Tag, Button, Modal, Input, message} from "antd";
import axios from "axios";
import {url} from "../Config.jsx";
import React, {useEffect, useState} from "react";
import {CommentOutlined, FacebookOutlined, PlusOutlined, QuestionCircleOutlined} from "@ant-design/icons";

export default function Home() {

    const [open, setOpen] = useState(false);
    const [isBotList, setBotList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();
    const [isBotData, setBotData] = useState({token:'',name:''})
    const showModal = () => {
        setOpen(true);
    };
    const handleOk = async () => {
        setLoading(true)
        const {data} = await axios.post(
            `${url}/api/v1/admin/createBot`, {...isBotData},{withCredentials: true}
        );

        if(data?.status || data === true){
            if(data?.user_message)
                messageApi.open({
                    type: data?.status || data === true ? 'success' : 'warning',
                    content: data?.user_message,
                });
            setBotData({token: '', name: ''})
            setOpen(false);
            setLoading(false)
        } else {
            if(data?.user_message)
                messageApi.open({
                    type: 'warning',
                    content: data?.user_message,
                });
            setLoading(false)
        }


    };
    const handleCancel = () => {
        setOpen(false);
    };

  async function getBotList() {

      const {data} = await axios.get(
          `${url}/api/v1/admin/getBotList`, {withCredentials: true}
      );
      setBotList(data)
  }

  useEffect(() => {
      getBotList();
  }, [isBotList]);

    const columns = [
        {
            title: 'Назва бота',
            dataIndex: 'name',
            key: 'name',
            align: 'center',
            width: '33%',
            render: (text) => <h5>{text}</h5>,
        },
        {
            title: 'Username | First name',
            dataIndex: 'age',
            key: 'age',
            align: 'center',
            width: '33%',
            render: (_, { username, first_name }) => (
                <>
                    <a href={`https://t.me/${username?.toLowerCase()}`} target='_blank'>
                        <Tag color="#3aafe1">
                            @{username?.toLowerCase()}
                        </Tag>
                    </a>
                    <Tag color={'geekblue'} key={'1'}>
                        {first_name?.toUpperCase()}
                    </Tag>
                </>
            ),
        },
        {
            title: 'Working',
            dataIndex: 'active',
            key: 'active',
            align: 'center',
            width: '10%',
            render: (_, { active, status }) => (
                <>
                    {active && status ?
                        <Tag bordered={false} color="success">
                            TRUE
                        </Tag>
                        :
                        <Tag bordered={false} color="error">
                            FALSE
                        </Tag>
                    }
                </>
            ),
        },
        {
            title: '',
            key: 'action',
            align: 'center',
            width: '33%',
            render: (_, record) => (
                <Space size="middle">
                    <Button color="primary" href={`/bot/${record?._id}`} variant="outlined">
                        Детально
                    </Button>
                </Space>
            ),
        },
    ];

  return (
      <>
          {contextHolder}
        <div className="layout-content">
            <Table columns={columns} dataSource={isBotList} />
            <FloatButton
                icon={<PlusOutlined style={{ fontSize: 18 }} />}
                type="primary"
                onClick={showModal}
                style={{
                    insetInlineEnd: 40,
                    width: 50,
                    height: 50,
                }}
            />
        </div>

          <Modal
              open={open}
              title="Додати нового бота"
              onOk={handleOk}
              onCancel={handleCancel}
              footer={[
                  <Button key="back" onClick={handleCancel}>
                      Закрити
                  </Button>,
                  <Button key="submit" type="primary" loading={loading} onClick={handleOk}>
                      Додати
                  </Button>,
              ]}
          >
              <div style={{marginTop:'20px'}}>
                  <p>
                      <h4>API Token</h4>
                      <Input value={isBotData.token} onChange={(e)=>{setBotData({...isBotData,token:e.target.value})}} placeholder={'API TOKEN'}/>
                  </p>
                  <p style={{marginTop:'20px'}}>
                      <h4>Ім'я бота в системі</h4>
                      <Input value={isBotData.name} onChange={(e)=>{setBotData({...isBotData,name:e.target.value})}} placeholder={'Bot name'}/>
                  </p>
              </div>
          </Modal>
      </>

  )
}
