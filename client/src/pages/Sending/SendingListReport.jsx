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
            title: 'Створено',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: '33%',
        },
        {
            title: 'Заплановано на',
            dataIndex: 'date',
            key: 'date',
            width: '33%',
        },
        {
            title: 'Надіслано',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            width: '33%',
        },
        {
            title: '',
            key: 'operation',
            fixed: 'right',
            width: '33%',
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
            width: '33%',
        },
        {
            title: 'Створено',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: '33%',
        },
        {
            title: '',
            key: 'operation',
            fixed: 'right',
            width: '33%',
            render: (record) => (
                <>
                    <div className="seminar_buttons">
                        <Button style={{marginRight:'10px'}} onClick={()=>{sendingsView(record)}}>Детальніше</Button>
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
                        <p>Розсилку створено:</p>
                        {formData.createdAt && ` ${formData.createdAt}`}
                    </div>
                    <div>
                        <p>Розсилку виконано:</p>
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