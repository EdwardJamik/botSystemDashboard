import React, {useCallback, useEffect, useState} from 'react';
import {Breadcrumb, Button, Col, ConfigProvider, Input, Row, Statistic, Table} from "antd";
import {DeleteOutlined, HomeOutlined, RobotOutlined, SearchOutlined, UserOutlined} from "@ant-design/icons";
import {useLocation} from "react-router-dom";
import axios from "axios";
import {url} from "../../Config.jsx";
import { useNavigate } from 'react-router-dom';

const BotPage = () => {

    const columns = [
        {
            title: 'First_name',
            dataIndex: 'first_name',
            width: '25%',
            align:'center',
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                <div style={{ padding: 8 }}>
                    <Input
                        placeholder="Пошук хештегу"
                        value={selectedKeys[0]}
                        onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                        onPressEnter={() => confirm()}
                        style={{ width: 188, marginBottom: 8, display: 'block' }}
                    />
                    <Button
                        type="primary"
                        onClick={() => confirm()}
                        size="small"
                        style={{ width: 90, marginRight: 8 }}
                    >
                        Пошук
                    </Button>
                    <Button onClick={() => clearFilters()} size="small" style={{ width: 90 }}>
                        Скинути
                    </Button>
                </div>
            ),
            onFilter: (value, record) =>
                record.hashtag.toLowerCase().includes(value.toLowerCase()),
            filterIcon: (filtered) => (
                <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
            ),
        },
        {
            title: 'Username',
            dataIndex: 'username',
            width: '25%',
            align:'center',
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                <div style={{ padding: 8 }}>
                    <Input
                        placeholder="Пошук хештегу"
                        value={selectedKeys[0]}
                        onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                        onPressEnter={() => confirm()}
                        style={{ width: 188, marginBottom: 8, display: 'block' }}
                    />
                    <Button
                        type="primary"
                        onClick={() => confirm()}
                        size="small"
                        style={{ width: 90, marginRight: 8 }}
                    >
                        Пошук
                    </Button>
                    <Button onClick={() => clearFilters()} size="small" style={{ width: 90 }}>
                        Скинути
                    </Button>
                </div>
            ),
            onFilter: (value, record) =>
                record.hashtag.toLowerCase().includes(value.toLowerCase()),
            filterIcon: (filtered) => (
                <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
            ),
        },
        {
            title: 'Час',
            dataIndex: 'createdAt',
            width: '25%',
            align:'center',
            sorter: (a, b) => a.count - b.count,
            defaultSortOrder: 'descend',
        },
        {
            title: '',
            dataIndex: 'chat_id',
            width: '25%',
            align:'center',
            render: (_, record) => <>
                <Button onClick={()=>removeHashTagItem(record?.chat_id,record?.chat_id_bot,record?.hashtag)} style={{fontSize:'12px'}} danger><DeleteOutlined /></Button>
            </>,
        },
    ];

    const [isBotData, setBotData] = useState()
    const [isBotGroup, setBotGroup] = useState([])
    const [isGroupMain, setGroupMain] = useState()
    const [isHashTags, setHashTags] = useState([])

    const location = useLocation();
    const navigate = useNavigate();


    const getGroupData = async (bot_id, group_id, hash_id) => {
        const {data} = await axios.post(
            `${url}/api/v1/admin/getHashData`, {bot_id, group_id, hash_id}, {withCredentials: true}
        );

        setBotData(data?.botData)
        setBotGroup(data?.hashTagData)
        setGroupMain(data?.groupMain)
        setHashTags(data?.hashTags)
    }

    const removeHashTagItem = async (group_id, chat_id, hashTag) => {
        const {data} = await axios.post(
            `${url}/api/v1/admin/deleteHashtag`, {group_id,chat_id,hashTag}, {withCredentials: true}
        );

        setBotData(data?.botData)
        setBotGroup(data?.botGroup)
        setGroupMain(data?.groupMain)
    }

    useEffect(() => {
        const pathname = location.pathname;
        const parts = pathname.split('/');
        const botId = parts[parts.length - 3];
        const chatId = parts[parts.length - 2];
        const hashId = parts[parts.length - 1];

        getGroupData(botId,chatId,hashId)
    }, []);

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
                        href: `/bot/${isBotData?._id}`,
                        title: (
                            <>
                                <RobotOutlined/>
                                <span>{isBotData?.status ? '🟢' : '🔴'}<span style={{
                                    fontWeight: 800,
                                    fontSize: '12px'
                                }}>Bot</span> {isBotData?.name} ({isBotData?.first_name})</span>
                            </>
                        ),
                    },
                    {

                        href: `/bot/${isBotData?._id}/${isGroupMain?.chat_id}`,
                        title: (
                            <>
                                <RobotOutlined/>
                                <span>{isBotData?.status ? '🟢' : '🔴'}<span style={{
                                    fontWeight: 800,
                                    fontSize: '12px'
                                }}>Group</span> {isGroupMain?.name}</span>
                            </>
                        ),
                    },
                    {
                        title: (
                            <>
                                <RobotOutlined/>
                                <span><span style={{
                                    fontWeight: 800,
                                    fontSize: '12px'
                                }}>Tag</span> {isHashTags?.hashtag}</span>
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
                        <Statistic title="Title" value={`${isHashTags?.hashtag}`} />
                    </ConfigProvider>
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