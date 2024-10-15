import React, {useEffect, useRef, useState} from 'react';
import { SearchOutlined } from '@ant-design/icons';

import Highlighter from 'react-highlight-words';
import {Button, Input, Modal, Space, Table} from 'antd';
import axios from "axios";
import ReactPlayer from "react-player";
import {url} from "../../Config.jsx";


const SendingListReport = () => {
    const [open, setOpen] = useState(false);
    const [data, setData] = useState([]);
    const [dataLoad, setDataLoad] = useState([]);

    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');
    const searchInput = useRef(null);

    const [formData, setFormData] = useState({
        viber:'',
        telegram: '',
        accepting_viber: '',
        accepting_telegram: '',
        type: '',
        _id: '',
        date:'',
        content: '',
        image: null,
        watch: null,
        un_sending_telegram: '',
        un_sending_viber: '',
        createdAt:'',
        updatedAt: '',
        __v: '',
        sending_telegram: '',
        sending_viber: '',
    });

    async function getSendingList() {

        const sendings = await axios.get(`${url}/api/v1/admin/sendingsList/`, {withCredentials: true});
        setData(sendings.data)

        const sendingsLoad = await axios.get(`${url}/api/v1/admin/sendingsListLoad/`, {withCredentials: true});
        setDataLoad(sendingsLoad.data)

        return true;
    }

    useEffect(() => {
        getSendingList();
    }, [dataLoad]);

    const showModalEdit = async () => {
        setOpen(!open);
    };

    async function sendingsView(record) {
        setOpen(!open)
        setFormData(record)
    }

    async function sendingsDeleted(id) {
        const data = {
            id:id
        }
        const sendings = await axios.post(`${url}/api/v1/admin/sendingsDelete/`,data, {withCredentials: true});
    }

    const handleSearch = (selectedKeys, confirm, dataIndex) => {
        confirm();
        setSearchText(selectedKeys[0]);
        setSearchedColumn(dataIndex);
    };
    const handleReset = (clearFilters) => {
        clearFilters();
        setSearchText('');
    };
    const getColumnSearchProps = (dataIndex) => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
            <div
                style={{
                    padding: 8,
                }}
                onKeyDown={(e) => e.stopPropagation()}
            >
                <Input
                    ref={searchInput}
                    placeholder={`Search ${dataIndex}`}
                    value={selectedKeys[0]}
                    onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
                    style={{
                        marginBottom: 8,
                        display: 'block',
                    }}
                />
                <Space>
                    <Button
                        type="primary"
                        onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
                        icon={<SearchOutlined />}
                        size="small"
                        style={{
                            width: 90,
                        }}
                    >
                        Search
                    </Button>
                    <Button
                        onClick={() => clearFilters && handleReset(clearFilters)}
                        size="small"
                        style={{
                            width: 90,
                        }}
                    >
                        Reset
                    </Button>
                    <Button
                        type="link"
                        size="small"
                        onClick={() => {
                            confirm({
                                closeDropdown: false,
                            });
                            setSearchText(selectedKeys[0]);
                            setSearchedColumn(dataIndex);
                        }}
                    >
                        Filter
                    </Button>
                    <Button
                        type="link"
                        size="small"
                        onClick={() => {
                            close();
                        }}
                    >
                        close
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: (filtered) => (
            <SearchOutlined
                style={{
                    color: filtered ? '#1677ff' : undefined,
                }}
            />
        ),
        onFilter: (value, record) =>
            record[dataIndex]?.toString()?.toLowerCase()?.includes(value?.toLowerCase()),
        onFilterDropdownOpenChange: (visible) => {
            if (visible) {
                setTimeout(() => searchInput.current?.select(), 100);
            }
        },
        render: (text) =>
            searchedColumn === dataIndex ? (
                <Highlighter
                    highlightStyle={{
                        backgroundColor: '#ffc069',
                        padding: 0,
                    }}
                    searchWords={[searchText]}
                    autoEscape
                    textToHighlight={text ? text.toString() : ''}
                />
            ) : (
                text
            ),
    });

    const columns = [
        {
            title: 'Месенджер',
            key: 'operation',
            width: '15%',
            render: (record) => (
                <>
                    {record.telegram && record.viber && ` Viber, Telegram`}
                    {record.telegram && !record.viber && `Telegram`}
                    {record.viber && !record.telegram && `Viber`}
                </>
            ),
        },
        {
            title: 'Користувачі на момент розсилки',
            key: 'operation',
            width: '20%',
            render: (record) => (
                <>
                    {record.un_sending_telegram && record.un_sending_viber && `Telegram: ${record.un_sending_telegram} | Viber: ${record.un_sending_viber}`}
                    {record.un_sending_telegram && !record.un_sending_viber && `Telegram: ${record.un_sending_telegram}`}
                    {record.un_sending_viber && !record.un_sending_telegram && `Viber: ${record.un_sending_viber}`}
                </>
            ),
        },
        {
            title: 'Надійшло',
            key: 'operation',
            width: '20%',
            render: (record) => (
                <>
                    {record.sending_telegram && record.sending_viber && `Telegram: ${record.sending_telegram} | Viber: ${record.sending_viber}`}
                    {record.sending_telegram && !record.sending_viber && `Telegram: ${record.sending_telegram}`}
                    {record.sending_viber && !record.sending_telegram && `Viber: ${record.sending_viber}`}
                </>
            ),
        },
        {
            title: 'Тип розсилки',
            dataIndex: 'type_sendings',
            key: 'type_sendings',
            width: '10%',
        },
        {
            title: 'Створено',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: '10%',
        },
        {
            title: 'Заплановано на',
            dataIndex: 'date',
            key: 'date',
            width: '10%',
        },
        {
            title: 'Закінчено',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            width: '10%',
        },
        {
            title: '',
            key: 'operation',
            fixed: 'right',
            width: 10,
            render: (record) => (
                <>
                    <div className="seminar_buttons">
                        <Button onClick={()=>{sendingsView(record)}}>Детальніше</Button>
                    </div>
                </>
            ),
        },

    ];
    const columns_two = [
        {
            title: 'Заплановано на',
            dataIndex: 'date',
            key: 'date',
            width: '25%',
        },
        {
            title: 'Месенджер',
            key: 'operation',
            width: '15%',
            render: (record) => (
                <>
                    {record.telegram && record.viber && ` Viber, Telegram`}
                    {record.telegram && !record.viber && `Telegram`}
                    {record.viber && !record.telegram && `Viber`}
                </>
            ),
        },
        {
            title: 'Користувачі на момент створення розсилки',
            key: 'operation',
            width: '25%',
            render: (record) => (
                <>
                    {record.un_sending_telegram && record.un_sending_viber && `Telegram: ${record.un_sending_telegram} | Viber: ${record.un_sending_viber}`}
                    {record.un_sending_telegram && !record.un_sending_viber && `Telegram: ${record.un_sending_telegram}`}
                    {record.un_sending_viber && !record.un_sending_telegram && `Viber: ${record.un_sending_viber}`}
                </>
            ),
        },
        {
            title: 'Тип розсилки',
            dataIndex: 'type_sendings',
            key: 'type_sendings',
            width: '10%',
        },
        {
            title: 'Створено',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: '10%',
        },
        {
            title: '',
            key: 'operation',
            fixed: 'right',
            width: 10,
            render: (record) => (
                <>
                    <div className="seminar_buttons">
                        <Button onClick={()=>{sendingsView(record)}}>Детальніше</Button>
                        <Button onClick={()=>{sendingsDeleted(record._id)}}>Видалити</Button>
                    </div>
                </>
            ),
        },

    ];

    return (
        <>
            <h3 style={{marginTop:'40px',marginBottom:'15px'}}>Відкладена розсилка</h3>
            <Table className='sendingList' columns={columns_two} dataSource={dataLoad} />
            <h3 style={{marginTop:'20px',marginBottom:'15px'}}>Виконана розсилка</h3>
            <Table className='sendingList' columns={columns} dataSource={data} />
            <Modal
                title={`Розсилка`}
                open={open}
                key='ok1'
                closable={false}
                footer={[<Button key="disabled" className="button_continue" onClick={()=>showModalEdit()}>
                    Закрити
                </Button>
                ]}
            >
                <form className="modal_sendings">
                    <div>
                        <p>Дата розсилки:</p>
                        {formData.date && `${formData.date}`}
                    </div>
                    <div>
                        <p>Месенджери розсилки:</p>
                        {formData.viber && formData.telegram &&'Telegram, Viber'}
                        {formData.telegram && !formData.viber && 'Telegram'}
                        {!formData.telegram && formData.viber && 'Viber'}
                    </div>
                    {formData.accepting_viber || formData.accepting_telegram ?
                    <div>
                        <p>Розсилку виконано для:</p>
                        {formData.accepting_viber && formData.accepting_telegram &&'Telegram, Viber'}
                        {formData.accepting_telegram && !formData.accepting_viber && 'Telegram'}
                        {!formData.accepting_telegram && formData.accepting_viber && 'Viber'}
                    </div>
                    :
                        <></>
                    }
                    <div>
                        <p>Категорія акаунтів:</p>
                        {formData.type && `${formData.type}`}
                    </div>
                    <div>
                        <p>Зареєстрованих користувачів до розсилки:</p>
                        {formData.un_sending_viber && formData.un_sending_telegram &&`Telegram: ${formData.un_sending_telegram} Viber: ${formData.un_sending_viber}`}
                        {formData.un_sending_viber && !formData.un_sending_telegram &&`Viber: ${formData.un_sending_viber}`}
                        {!formData.un_sending_viber && formData.un_sending_telegram &&`Telegram: ${formData.un_sending_telegram}`}
                    </div>
                    {formData.sending_telegram || formData.sending_viber ?
                    <div>
                        <p>Надіслано користувачам:</p>
                        {formData.sending_viber && formData.sending_telegram &&`Telegram: ${formData.sending_telegram} Viber: ${formData.sending_viber}`}
                        {formData.sending_viber && !formData.sending_telegram &&`Viber: ${formData.sending_viber}`}
                        {!formData.sending_viber && formData.sending_telegram &&`Telegram: ${formData.sending_telegram}`}
                    </div>
                        :
                        <></>
                    }
                    <div>
                        <p>Розсилку створено:</p>
                        {formData.createdAt && ` ${formData.createdAt}`}
                    </div>
                    <div>
                        <p>Розсилку закінчено:</p>
                        {formData.updatedAt && ` ${formData.updatedAt}`}
                    </div>

                    <div>
                        <p>Контент:</p>
                        {formData.content && `${formData.content}`}
                    </div>
                        {Array.isArray(formData.watch) || !Array.isArray(formData.watch) && formData.watch !== null ?
                            <div>
                                {Array.isArray(formData?.watch) ? formData?.watch?.map((item, index) => (
                                    <ReactPlayer
                                        url={`${url}/sending-images/`+ item}
                                        controls={true}
                                        width="100%"
                                        height="auto"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                    ))
                                    :
                                    <ReactPlayer
                                        url={`${url}/sending-images/${formData.watch}`}
                                        controls={true}
                                        width="100%"
                                        height="auto"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                }

                            </div>
                            :
                            <></>
                        }
                    {Array.isArray(formData?.image) || (formData?.image && formData?.image !== null) ? (
                        <div>
                            {Array.isArray(formData?.image) ? (
                                    formData?.image?.map((item, index) => (
                                            <img
                                                style={{margin: '6px auto'}}
                                                key={index}
                                                src={`${url}/sending-images/${item}`}
                                                alt="Sending Image"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    // e.preventDefault();
                                                }}
                                            />
                                        )
                                    )
                                ) :
                                <img
                                    style={{margin: '6px auto'}}
                                    key={index}
                                    src={`${url}/sending-images/${formData.image}`}
                                    alt="Sending Image"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        // e.preventDefault();
                                    }}
                                />

                            }
                        </div>
                    ) : (
                        <></>
                    )}

                </form>
            </Modal>
        </>

    );
};
export default SendingListReport;