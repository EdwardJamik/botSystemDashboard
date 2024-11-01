import React, {useEffect, useState} from 'react';
import {Breadcrumb, Button, Col, ConfigProvider, Row, Statistic, Table, Tag} from "antd";
import {HomeOutlined, RobotOutlined} from "@ant-design/icons";
import {useLocation} from "react-router-dom";
import axios from "axios";
import {url} from "../../Config.jsx";
import { useNavigate } from 'react-router-dom';

const BotPage = () => {

    const [isBotData, setBotData] = useState()
    const [isBotGroup, setBotGroup] = useState()
    const location = useLocation();
    const navigate = useNavigate();

    const getBotData = async (id) => {
        const {data} = await axios.post(
            `${url}/api/v1/admin/getBotData`, {id}, {withCredentials: true}
        );

        setBotData(data?.botData)
        setBotGroup(data?.botGroup)
    }

    const reloadBot = async (id) => {
        const {data} = await axios.post(
            `${url}/api/v1/admin/reloadBot`, {id}, {withCredentials: true}
        );

        setBotData(data?.botData)
        setBotGroup(data?.botGroup)
    }

    const removeBot = async (id) => {
        const {data} = await axios.post(
            `${url}/api/v1/admin/removeBot`, {id}, {withCredentials: true}
        );

        if(data?.status){
            navigate('/');
        }
    }

    const columns = [
        {
            title: 'Group name',
            dataIndex: 'name',
            width: '40%',
        },
        {
            title: 'Working',
            dataIndex: 'working',
            width: '40%',
            render: (working) => <>
                {working ?
                    <Tag bordered={false} color="success">
                        TRUE
                    </Tag>
                    :
                    <Tag bordered={false} color="error">
                        FALSE
                    </Tag>
                }

            </>,
        },
        {
            title: '',
            dataIndex: 'chat_id',
            width: '20%',
            render: (chat_id) => <>
                <Button href={`/bot/${isBotData?._id}/${chat_id}`}>Статистика</Button>
            </>,
        },
    ];

    useEffect(() => {
        const pathname = location.pathname;
        const parts = pathname.split('/');
        const id = parts[parts.length - 1];

        getBotData(id)
    }, [location,isBotData]);

    return (
        <div>
            <Breadcrumb
                style={{marginBottom:'24px'}}
                items={[
                    {
                        href: '/',
                        title: <HomeOutlined />,
                    },
                    {
                        title: (
                            <>
                                <RobotOutlined />
                                <span>{isBotData?.status ? '🟢' : '🔴' }<span style={{fontWeight:800, fontSize:'12px'}}>Bot</span> {isBotData?.name} ({isBotData?.first_name})</span>
                            </>
                        ),
                    }
                ]}
            />
            <Row gutter={16}>
                <Col span={12}>
                    <ConfigProvider
                        theme={{
                            components: {
                                Statistic: {
                                    contentFontSize: 18,
                                },
                            },
                        }}
                    >
                        <Statistic title="Status" value={`${isBotData?.status ? '🟢' : '🔴' }`} />
                        <Statistic title="First name" value={`${isBotData?.first_name}`} />
                        <Statistic style={{marginTop:'14px'}} title="Username" value={`@${isBotData?.username}`} />
                    </ConfigProvider>
                </Col>
                <Col span={12}>
                    <ConfigProvider
                        theme={{
                            components: {
                                Statistic: {
                                    contentFontSize: 18,
                                },
                            },
                        }}
                    >
                        <Statistic
                            style={{marginTop:'14px'}}
                            title="chat_id"
                            value={isBotData?.chat_id}
                            formatter={(value) => value.toString().replace(/,/g, '')}
                        />
                    </ConfigProvider>
                    <Button
                        style={{
                            marginTop: 16,
                            marginRight: 10
                        }}
                        variant="outlined"
                        href={`/bot/${isBotData?._id}/mailing`}
                    >
                        Розсилка
                    </Button>
                    <Button
                        style={{
                            marginTop: 16,
                            marginRight: 10
                        }}
                        onClick={()=>reloadBot(isBotData?._id)}
                        type="primary"
                    >
                        {isBotData?.status ? 'Зупинити' : 'Ввімкнути'}

                    </Button>
                    <Button
                        style={{
                            marginTop: 16,
                        }}
                        type='primary'
                        danger
                        onClick={()=>removeBot(isBotData?._id)}
                    >
                        Видалити
                    </Button>
                </Col>
                <Col span={24}>
                    <hr/>
                    <Table columns={columns} dataSource={isBotGroup} />
                </Col>
            </Row>
        </div>
    );
};

export default BotPage;