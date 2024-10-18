import React, {useEffect, useState} from 'react';
import axios from "axios";
import {url} from "../../Config";
import {Button, Cascader, DatePicker, Input, message, Select, Spin, Upload} from "antd";
import TextArea from "antd/es/input/TextArea";
import dayjs from "dayjs";
import {EnvironmentOutlined, PhoneOutlined, UploadOutlined} from "@ant-design/icons";
const { SHOW_CHILD } = Cascader;

const SendingList = () => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false)
    const [link_error, setLinkError] = useState(false)
    const [isUsers, setUsers] = useState([]);
    const {Option} = Select;

    const [isDate, setDate] = React.useState('');

    const [fileList, setFileList] = React.useState([]);
    const [fileListVideo, setFileListVideo] = React.useState([]);
    const [newFileName, setNewFileName] = useState([]);
    const [newFileNameVideo, setNewFileNameVideo] = useState([]);
    const [formData, setFormData] = useState({
        text: '',
        messanger: [],
        date: '',
        type: [],
        users: [],
        video: [],
        photo: [],
    });

    const showModal = () => {
        resetFormData()
        setOpen(!open);
    };

    const resetFormData = () => {
        setDate('')
        setNewFileName([])
        setNewFileNameVideo([])
        setFileListVideo([])
        setFileList([])
        setFormData({
            text: '',
            messanger: [],
            date: '',
            type: [],
            users: [],
            video: [],
            photo: [],
        });
    };

    useEffect(() => {
        if (formData.messanger.length && formData.type) {
            async function getUsersList() {

                const sendingData = {
                    type: formData.type,
                    messanger: formData.messanger
                }

                const {data} = await axios.post(`${url}/api/v1/admin/sendingsUserList/`, sendingData, {withCredentials: true});

                setUsers([{value:'All', label:'Всі'},...data.data])

                return true;
            }

            getUsersList()
        }
    }, [formData.messanger, formData.type]);

    const handleInputChange = (e) => {
        const {name, value} = e.target;

        // if(name === 'store_link'){
        //     const httpsLinkRegex = /^https:\/\/[^\s/$.?#].[^\s]*$/;
        //
        //     if(httpsLinkRegex.test(value)){
        //         setLinkError(false)
        //         setFormData({
        //             ...formData,
        //             [name]: value,
        //         });
        //     } else{
        //         setLinkError(true)
        //         setFormData({
        //             ...formData,
        //             [name]: value,
        //         });
        //     }
        //
        // } else{
            setFormData({
                ...formData,
                [name]: value,
            });
        // }


    };

    const disabledDate = (current) => {
        return current && current.isBefore(dayjs(), 'day');
    };

    const disabledHours = () => {
        const currentHour = dayjs().hour();
        return Array.from({ length: currentHour }, (_, i) => i);
    };

    const disabledMinutes = (selectedHour) => {
        if (selectedHour === dayjs().hour()) {
            const currentMinute = dayjs().minute();
            return Array.from({ length: currentMinute }, (_, i) => i);
        }
        return [];
    };

    const handleDateChange = (date) => {
        const sending_date = dayjs(date).locale('uk').format()
        setFormData({
            ...formData,
            date: sending_date,
        });
        setDate(date)
    };

    const props = {
        action: `${url}/uploadSending`,
        accept:".jpg, .jpeg, .png",
        listType:"picture",
        maxCount:10,
        onChange(info) {
            if (info.file.status === 'done') {
                message.success(`Зображення ${info.file.name} успішно завантажено`);
                setNewFileName([...newFileName, info.file.response.newFileName]);
                setFormData(prevFormData => ({
                    ...prevFormData,
                    photo: [...newFileName,info.file.response.newFileName],
                }));
            } else if (info.file.status === 'error') {
                message.error(`Помилка, зображення '${info.file.name}' не було завантажено.`);
            }

            setFileList(info.fileList);
        },
        onRemove(file) {
            axios.post(`${url}/deleteUploadSending`, { filename: file?.response?.newFileName})
                .then(response => {
                    setNewFileName([])
                    const index = newFileName.indexOf(file?.response?.newFileName);

                    if (index !== -1) {
                        const files = newFileName
                        files.splice(index, 1);
                        setNewFileName(files)
                        setFormData(prevFormData => ({
                            ...prevFormData,
                            photo: [...files],
                        }));
                    }

                })
                .catch(error => {
                    console.error('Error deleting file:', error);
                });
        },
    };

    const propsVideo = {
        action: `${url}/uploadSending`,
        accept:".mp4",
        maxCount:10,
        onChange(info) {
            if (info.file.status === 'done') {
                message.success(`Відео ${info.file.name} успішно завантажено`);
                setNewFileNameVideo([...newFileNameVideo,info.file.response.newFileName]);

                setFormData(prevFormData => ({
                    ...prevFormData,
                    video: [...formData.video, info.file.response.newFileName],
                }));
            } else if (info.file.status === 'error') {
                message.error(`Помилка, зображення '${info.file.name}' не було завантажено.`);
            }
            setFileListVideo(info.fileList);
        },
        onRemove(file) {
            axios.post(`${url}/deleteUploadSending`, { filename: file?.response?.newFileName  })
                .then(response => {

                    const index = newFileNameVideo.indexOf(file?.response?.newFileName);

                    if (index !== -1) {
                        const files = [...newFileNameVideo]
                        files.splice(index, 1);

                        setNewFileNameVideo(files)
                        setFormData(prevFormData => ({
                            ...prevFormData,
                            video: [...files],
                        }));
                    }

                })
                .catch(error => {
                    console.error('Error deleting file:', error);
                });
        },
    };

    const handleUpload = async () => {
        try {
            let videoName, imageName;
            let seminarData = {
                ...formData,
            };

            if ((formData.type).length && (formData.messanger).length && formData.text !== '' && (formData.users).length || formData.text === '' && formData.video.length || formData.text === '' && formData.photo.length) {

                if (formData.photo.length && formData.text !== '' && (formData.text).length <= 768 || formData.video.length && formData.text !== '' && (formData.text).length <= 768 || !formData.video.length && !formData.photo.length && formData.text !== '') {

                    const httpsLinkRegex = /^https:\/\/[^\s/$.?#].[^\s]*$/;

                    // if(httpsLinkRegex.test(formData.store_link)) {
                        const createSeminarResponse = await axios.post(`${url}/api/v1/admin/createSending/`, seminarData, {withCredentials: true});

                        if (createSeminarResponse) {
                            message.success('Розсилку створено')
                            setLoading(false)
                            resetFormData()
                            showModal()
                        }
                    // } else{
                    //     message.warning('Невірний формат посилання, приклад посилання: "https://elfori.com/sales"')
                    // }
                } else {
                    setLoading(false)
                    message.warning('Розсилка з фото/відео повинен містити не більше 768 символів')
                }

            } else {
                if (!(formData.type).length) {
                    message.warning('Вкажіть тип акаунту для розсилки')
                } else if (!(formData.messanger).length) {
                    message.warning('Вкажіть тип месенджеру для розсилки')
                } else if (formData.text === '' && formData.photo === null && formData.video === null) {
                    message.warning('Заповніть текст, фото або відео для розсилки')
                } else if (!(formData.users).length) {
                    message.warning('Оберіть користувачів для яких виконується розсилка')
                }
            }

        } catch (error) {
            console.error('Виникла помилка при завантаженні файлу чи створенні семінару:', error);
        }
    };

    const handleChange = (value) => {
        console.log(value);
    };

    const options = [
        {
            label: 'Light',
            value: 'light',
            children: new Array(20).fill(null).map((_, index) => ({
                label: `Number ${index}`,
                value: index,
            })),
        },
        {
            label: 'Bamboo',
            value: 'bamboo',
            children: [
                {
                    label: 'Little',
                    value: 'little',
                    children: [
                        {
                            label: 'Toy Fish',
                            value: 'fish',
                        },
                        {
                            label: 'Toy Cards',
                            value: 'cards',
                        },
                        {
                            label: 'Toy Bird',
                            value: 'bird',
                        },
                    ],
                },
            ],
        },
    ];

    return (
        <div className='modal_sendings_forms'>
            {loading && <Spin className='loading_spin'/>}
            <form className="modal_sendings_creator">
                <div>
                    <p>Контент</p>
                    <TextArea
                        rootClassName="textarea__buttons"
                        showCount
                        style={{
                            height: 200,
                            resize: 'none',
                        }}
                        name="text"
                        value={formData.text}
                        onChange={handleInputChange}
                        className="answer_textarea"
                    />
                </div>
                <div>
                    <p>Дата та час розсилки</p>
                    <DatePicker value={isDate}
                                showTime={{
                                    format: 'HH:mm',
                                    disabledHours: disabledHours,
                                    disabledMinutes: disabledMinutes,
                                }}
                                changeOnBlur={true}
                                format="YYYY-MM-DD HH:mm"
                                onChange={handleDateChange}
                                disabledDate={disabledDate}/>
                </div>
                {!newFileName.length &&
                    <div>
                        <p>Відео</p>
                        <Upload
                            {...propsVideo}
                            fileList={fileListVideo}
                            maxCount={10}
                            multiple
                            style={{margin: '0 auto'}}
                        >
                            <Button style={{display: 'flex', alignItems: 'center', margin: '0 auto'}}
                                    icon={<UploadOutlined/>}>Завантажити (Max: 10)</Button>
                        </Upload>
                    </div>
                }


                {!newFileNameVideo.length &&
                    <div>
                        <p>Фото</p>
                        <Upload
                            {...props}
                            fileList={fileList}
                            maxCount={10}
                            multiple
                            style={{margin: '0 auto'}}
                        >
                            <Button style={{display: 'flex', alignItems: 'center', margin: '0 auto'}}
                                    icon={<UploadOutlined/>}>Завантажити (Max: 10)</Button>
                        </Upload>
                    </div>
                }
                <div>
                    <p>Оберіть групу для розсилки</p>
                    <Cascader
                        style={{
                            width: '100%',
                        }}
                        options={options}
                        onChange={handleChange}
                        multiple
                        maxTagCount="responsive"
                        showCheckedStrategy={SHOW_CHILD}
                    />
                </div>
                <Button key="saved" type="primary" onClick={() => handleUpload()}>
                    Створити
                </Button>
            </form>
        </div>
    );
};

export default SendingList;