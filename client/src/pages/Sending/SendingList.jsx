import React, {useEffect, useState} from 'react';
import axios from "axios";
import {url} from "../../Config";
import {Button, Cascader, DatePicker, message, Select, Spin, Upload} from "antd";
import TextArea from "antd/es/input/TextArea";
import dayjs from "dayjs";
import {UploadOutlined} from "@ant-design/icons";
const { SHOW_CHILD } = Cascader;

const SendingList = () => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false)
    const [isOption, setOption] = useState([])

    const [isDate, setDate] = React.useState('');
    const [isGallery, setGallery] = React.useState([]);

    const [fileList, setFileList] = React.useState([]);
    const [fileListVideo, setFileListVideo] = React.useState([]);
    const [newFileName, setNewFileName] = useState([]);
    const [newFileNameVideo, setNewFileNameVideo] = useState([]);
    const [formData, setFormData] = useState({
        text: '',
        date: '',
        group: [],
        file_id: [],
        video: [],
        photo: [],
    });

    const showModal = () => {
        resetFormData()
        setOpen(!open);
    };

    const resetFormData = () => {
        setFormData({
            text: '',
            date: '',
            group: [],
            file_id: [],
            video: [],
            photo: [],
        });

        setDate('')
        setNewFileName([])
        setNewFileNameVideo([])
        setFileListVideo([])
        setFileList([])

    };

    useEffect(() => {
            async function getGroupList() {

                const pathname = location.pathname;
                const parts = pathname.split('/');
                const bot_id = parts[parts.length - 2];

                const {data} = await axios.post(`${url}/api/v1/admin/sendingsGroupList/`, {bot_id}, {withCredentials: true});

                setGallery([...data?.gallery])
                setOption([...data?.thread])

                return true;
            }

            getGroupList()
    }, []);

    const handleInputChange = (e, value) => {
        if(e === 'group'){
            setFormData({
                ...formData,
                ['group']: value,
            });
        } else if(e === 'file_id'){
            setFormData({
                ...formData,
                ['file_id']: value,
            });
        } else {
            const {name, value} = e.target;
            setFormData({
                ...formData,
                [name]: value,
            });
        }
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
            const pathname = location.pathname;
            const parts = pathname.split('/');
            const bot_id = parts[parts.length - 2];

            let seminarData = {
                ...formData,
                bot_id: bot_id,
            };

            if (formData.text !== '' && (formData.group).length || formData.text === '' && formData.video.length || formData.text === '' && formData.photo.length || formData.video.length || formData?.file_id?.length && formData?.file_id !== '' ) {

                if (formData.photo.length && formData.text !== '' && (formData.text).length <= 768 || formData.video.length && formData.text !== '' && (formData.text).length <= 768 || !formData.video.length && !formData.photo.length && formData.text !== '' || formData?.file_id?.length && formData?.file_id !== '' && (formData.text).length <= 768) {

                        const createSeminarResponse = await axios.post(`${url}/api/v1/admin/createSending/`, seminarData, {withCredentials: true});

                        if (createSeminarResponse) {
                            message.success('Розсилку створено')
                            setLoading(false)
                            resetFormData()
                            showModal()
                        }

                } else {
                    setLoading(false)
                    message.warning('Розсилка з фото/відео повинен містити не більше 768 символів')
                }

            } else {
                if (formData.text === '' && formData.photo === null && formData.video === null) {
                    message.warning('Заповніть текст, фото або відео для розсилки')
                } else if (formData.group.length) {
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
                        <p>Відео (завантажте або оберіть із надісланих боту)</p>
                        <div style={{display:'flex',alignItems:'center'}}>
                            {!formData?.file_id?.length &&
                                <div  style={{marginRight:'20px'}}>
                                    <Upload
                                        {...propsVideo}
                                        fileList={fileListVideo}
                                        maxCount={10}
                                        multiple
                                    >
                                        <Button style={{display: 'flex', alignItems: 'center', margin: '0 auto'}}
                                                icon={<UploadOutlined/>}>Завантажити (Max: 10)</Button>
                                    </Upload>
                                </div>

                            }
                            {!newFileNameVideo.length &&
                            <Select
                                onChange={(value)=> handleInputChange('file_id', value)}
                                style={{height:'40px', maxWidth:'150px',width:'100%'}}
                                placeholder="Збережене відео"
                                value={formData?.file_id}
                                allowClear
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                                options={isGallery}
                            />
                            }
                        </div>

                    </div>
                }


                {!newFileNameVideo.length && !formData?.file_id?.length &&
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
                        options={isOption}
                        name="group"
                        onChange={(value)=>handleInputChange('group', value)}
                        multiple
                        maxTagCount="responsive"
                        showCheckedStrategy={SHOW_CHILD}
                        value={formData.group}
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