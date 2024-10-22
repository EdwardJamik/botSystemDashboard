import React, {useCallback, useEffect, useState} from 'react';
import {Breadcrumb, Button, Col, ConfigProvider, Input, Row, Statistic, Table, Tabs} from "antd";
import {DeleteOutlined, HomeOutlined, RobotOutlined, SearchOutlined, UserOutlined} from "@ant-design/icons";
import {useLocation} from "react-router-dom";
import axios from "axios";
import {url} from "../../Config.jsx";
import { useNavigate } from 'react-router-dom';

const BotPage = () => {

    const columns = [
        {
            title: 'Хештег',
            dataIndex: 'hashtag',
            width: '40%',
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
            title: 'Кількість',
            dataIndex: 'count',
            width: '40%',
            align:'center',
            sorter: (a, b) => a.count - b.count,
            defaultSortOrder: 'descend',
        },
        {
            title: '',
            dataIndex: 'chat_id',
            width: '20%',
            align:'center',
            render: (_, record) => <>
                <Button style={{fontSize:'12px', marginRight:'10px'}} href={`/bot/${isBotData?._id}/${record?.chat_id}/${record?._id}${activeKey === 'all' ? '/all' : '/selected' }`}><UserOutlined /></Button>
                <Button onClick={()=>removeHashTagItem(record?.chat_id,record?.chat_id_bot,record?.hashtag)} style={{fontSize:'12px'}} danger><DeleteOutlined /></Button>
            </>,
        },
    ];

    const [activeKey, setActiveKey] = useState('all');
    const [isBotData, setBotData] = useState()
    const [isBotGroup, setBotGroup] = useState([])
    const [isAllHash, setAllHash] = useState([])
    const [isGroupMain, setGroupMain] = useState()
    const [isHashTags, setHashTags] = useState()

    const location = useLocation();
    const navigate = useNavigate();

    const disabledPars = useCallback(async (id) => {
        const pathname = location.pathname;
        const parts = pathname.split('/');
        const botId = parts[parts.length - 2];
        const chatId = parts[parts.length - 1];

        try {
            const { data } = await axios.post(
                `${url}/api/v1/admin/disabledParse`,
                { id, chat_id: chatId },
                { withCredentials: true }
            );

            setBotGroup(prevBotGroup =>
                prevBotGroup.map(group =>
                    group.thread_id === id
                        ? { ...group, working: !group.working }
                        : group
                )
            );
        } catch (error) {
            console.error("Error toggling parse status:", error);
        }
    }, [location]);

    const renderTabContent = useCallback((key) => (
        <Col span={24}>
            {key !== 'all' && (
                <Button
                    style={{width:'100%', marginBottom:'20px'}}
                    danger={isBotGroup.find(group => group.thread_id === key)?.working}
                    onClick={() => disabledPars(key)}
                >
                    {isBotGroup.find(group => group.thread_id === key)?.working ? 'Вимкнути парсинг' : 'Ввімкнути парсинг'}
                </Button>
            )}
            <Table
                columns={columns}
                dataSource={isHashTags}
            />
        </Col>
    ), [isBotGroup, isHashTags, disabledPars]);

    const getTabs = useCallback(() => [
        {
            label: 'Всі',
            key: 'all',
            children: <Col span={24}><Table columns={columns} dataSource={isAllHash} /></Col>,
        },
        ...isBotGroup.map((item) => ({
            label: item.name,
            key: item._id,
            children: renderTabContent(item.thread_id),
        }))
    ], [isBotGroup, isAllHash, renderTabContent]);

    const getGroupData = async (group_id, bot_id) => {
        const {data} = await axios.post(
            `${url}/api/v1/admin/getGroupData`, {group_id,bot_id}, {withCredentials: true}
        );

        setBotData(data?.botData)
        setBotGroup(data?.botGroup)
        setGroupMain(data?.groupMain)
        setHashTags(data?.hashTags)
        setAllHash(data?.hashTags)
    }

    const removeHashTagItem = async (group_id, chat_id, hashTag) => {
        const {data} = await axios.post(
            `${url}/api/v1/admin/deleteHashtag`, {group_id,chat_id,hashTag,activeKey}, {withCredentials: true}
        );

        setBotData(data?.botData)
        setBotGroup(data?.botGroup)
        setGroupMain(data?.groupMain)
        setHashTags(data?.hashTags)
        setAllHash(data?.allHashTags)
    }

    const changeGroup = async (value) => {
        setActiveKey(value);
        if(value !== 'all'){
            const pathname = location.pathname;
            const parts = pathname.split('/');
            const botId = parts[parts.length - 2];
            const chatId = parts[parts.length - 1];

            const {data} = await axios.post(
                `${url}/api/v1/admin/getGroupTags`, {id:value, group_id: chatId}, {withCredentials: true}
            );


            setHashTags(data?.hashTags)
        } else {
            const pathname = location.pathname;
            const parts = pathname.split('/');
            const botId = parts[parts.length - 2];
            const chatId = parts[parts.length - 1];
            const {data} = await axios.post(
                `${url}/api/v1/admin/getGroupData`, {group_id: chatId,bot_id:botId}, {withCredentials: true}
            );
            setBotData(data?.botData)
            setBotGroup(data?.botGroup)
            setGroupMain(data?.groupMain)
            setHashTags(data?.hashTags)
        }

    }

    const stopedPars = async (chat_id) => {
        const changeStatus = await axios.post(
            `${url}/api/v1/admin/stopedParsedGroup`, {chat_id}, {withCredentials: true}
        );

        const pathname = location.pathname;
        const parts = pathname.split('/');
        const botId = parts[parts.length - 2];
        const chatId = parts[parts.length - 1];
        const {data} = await axios.post(
            `${url}/api/v1/admin/getGroupData`, {group_id:chatId,bot_id:botId}, {withCredentials: true}
        );

        setBotData(data?.botData)
        setBotGroup(data?.botGroup)
        setGroupMain(data?.groupMain)
        setHashTags(data?.hashTags)
        setAllHash(data?.hashTags)
    }

    const removeGroup = async (id) => {
        const {data} = await axios.post(
            `${url}/api/v1/admin/removeGroup`, {chat_id:id}, {withCredentials: true}
        );

        if(data?.status){
            navigate('/');
        }
    }

    useEffect(() => {
        const pathname = location.pathname;
        const parts = pathname.split('/');
        const botId = parts[parts.length - 2];
        const chatId = parts[parts.length - 1];
        getGroupData(chatId,botId)
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
                        title: (
                            <>
                                <RobotOutlined/>
                                <span>{isBotData?.status ? '🟢' : '🔴'}<span style={{
                                    fontWeight: 800,
                                    fontSize: '12px'
                                }}>Group</span> {isGroupMain?.name}</span>
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
                        <Statistic title="Title" value={`${isGroupMain?.name}`} />
                    <Statistic
                        style={{marginTop:'14px'}}
                        title="chat_id"
                        value={isGroupMain?.chat_id}
                        formatter={(value) => value.toString().replace(/,/g, '')}
                    />
                    </ConfigProvider>
                </Col>
                <Col span={12}>
                    <Button
                        style={{
                            marginTop: 16,
                            marginRight: 10
                        }}
                        onClick={()=>stopedPars(isGroupMain?.chat_id)}
                        type="primary"
                    >
                        {isGroupMain?.working ? 'Зупинити парсинг' : 'Ввімкнути'}

                    </Button>
                    <Button
                        style={{
                            marginTop: 16,
                        }}
                        type='primary'
                        danger
                        onClick={()=> removeGroup(isGroupMain?.chat_id)}
                    >
                        Видалити
                    </Button>
                </Col>
                <Tabs
                    activeKey={activeKey}
                    onChange={(value) => changeGroup(value)}
                    type="card"
                    style={{width:'100%', marginTop:'20px'}}
                    items={getTabs()}
                />
            </Row>
        </div>
    );
};

export default BotPage;