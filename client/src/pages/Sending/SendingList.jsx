import React, {useEffect, useState} from 'react';
import axios from "axios";
import {url} from "../../Config";
import {Button, DatePicker, Input, message, Select, Spin, Upload} from "antd";
import TextArea from "antd/es/input/TextArea";
import dayjs from "dayjs";
import {EnvironmentOutlined, PhoneOutlined, UploadOutlined} from "@ant-design/icons";

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
        store_link: 'https://elfori.com/sales',
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
            store_link: 'https://elfori.com/sales',
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

        if(name === 'store_link'){
            const httpsLinkRegex = /^https:\/\/[^\s/$.?#].[^\s]*$/;

            if(httpsLinkRegex.test(value)){
                setLinkError(false)
                setFormData({
                    ...formData,
                    [name]: value,
                });
            } else{
                setLinkError(true)
                setFormData({
                    ...formData,
                    [name]: value,
                });
            }

        } else{
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
            let videoName, imageName;
            let seminarData = {
                ...formData,
            };

            if ((formData.type).length && (formData.messanger).length && formData.text !== '' && (formData.users).length || formData.text === '' && formData.video.length || formData.text === '' && formData.photo.length) {

                if (formData.photo.length && formData.text !== '' && (formData.text).length <= 768 || formData.video.length && formData.text !== '' && (formData.text).length <= 768 || !formData.video.length && !formData.photo.length && formData.text !== '') {

                    const httpsLinkRegex = /^https:\/\/[^\s/$.?#].[^\s]*$/;

                    if(httpsLinkRegex.test(formData.store_link)) {
                        const createSeminarResponse = await axios.post(`${url}/api/v1/admin/createSending/`, seminarData, {withCredentials: true});

                        if (createSeminarResponse) {
                            message.success('Розсилку створено')
                            setLoading(false)
                            resetFormData()
                            showModal()
                        }
                    } else{
                        message.warning('Невірний формат посилання, приклад посилання: "https://elfori.com/sales"')
                    }
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

    const options = [{label: 'Viber', value: 'viber'}, {label: 'Telegram', value: 'telegram'}];

    const options_category = [{label: 'Косметологія', value: 'Cosmetology'}, {
        label: 'Перукарство',
        value: 'Hairdressing'
    }, {label: 'Інше', value: 'Other'}, {label: 'Всі', value: 'All'}, {label: 'Не зареєстровані', value: ''}]

    const handleChange = (value) => {
        setFormData({
            ...formData,
            messanger: value,
            users: [],
        });
    };

    const handleChangeCategroy = (value) => {
        setFormData({
            ...formData,
            type: value,
            users: [],
        });

    };

    const handleChangeUsers = (value) => {
        setFormData({
            ...formData,
            users: value,
        });
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
                    <p>Тип акаунту</p>
                    <Select
                        value={formData.type}
                        mode="tags"
                        style={{
                            width: '100%',
                        }}
                        placeholder="Тип акаунту"
                        onChange={handleChangeCategroy}
                        options={options_category}
                    />
                </div>
                <div>
                    <p>Месенджер</p>
                    <Select
                        value={formData.messanger}
                        mode="tags"
                        allowClear
                        style={{
                            width: '100%',
                        }}
                        placeholder="Месенджер"
                        onChange={handleChange}
                        options={options}
                    />
                </div>
                {formData.messanger.length && formData.type ?
                    (<div>
                        <p>Користувачі</p>
                        <Select
                            value={formData.users}
                            mode="multiple"
                            allowClear
                            style={{
                                width: '100%',
                            }}
                            optionLabelProp="label"
                            placeholder="Користувачі"
                            onChange={handleChangeUsers}
                            filterOption={(input, option) =>
                                (option?.label?.props?.children[0]?.props?.children[1] && option?.label?.props?.children[0]?.props?.children[1].toLowerCase().indexOf(input.toLowerCase()) >= 0) ||
                                (option?.label?.props?.children[1]?.props?.children[1] && option?.label?.props?.children[1]?.props?.children[1].toLowerCase().indexOf(input.toLowerCase()) >= 0) ||
                                (option?.label?.props?.children[2]?.props?.children[1] && option?.label?.props?.children[2]?.props?.children[1].toLowerCase().indexOf(input.toLowerCase()) >= 0)
                            }
                            options={(isUsers || []).map((d) => ({
                                value: d?.value,
                                label: d?.label ? d.label : (
                                    <div style={{display: 'flex', alignItems: 'center'}}>
                                        <div style={{marginRight: '10px'}}>
                                            {d?.type === 'Viber' ?
                                                <svg width="24px" height="24px" viewBox="0 0 32 32" fill="none">
                                                    <path
                                                        fillRule="evenodd" clipRule="evenodd"
                                                        d="M30 15.3785C30 6.20699 26.7692 2 16 2C5.23077 2 2 6.20699 2 15.3785C2 21.9055 3.63629 25.9182 8.46154 27.6895V30.7774C8.46154 31.9141 9.88769 32.4332 10.6264 31.5656L13.1164 28.6411C14.0113 28.7185 14.9713 28.7569 16 28.7569C26.7692 28.7569 30 24.5499 30 15.3785ZM13.7113 26.5316C14.4251 26.5882 15.1872 26.6164 16 26.6164C25.1124 26.6164 27.8462 23.0825 27.8462 15.3785C27.8462 7.67443 25.1124 4.14055 16 4.14055C6.88757 4.14055 4.15385 7.67443 4.15385 15.3785C4.15385 20.8239 5.51965 24.1859 9.53846 25.6891V30.2639C9.53846 30.6627 10.0389 30.8449 10.2981 30.5404L13.7113 26.5316Z"
                                                        fill="#BFC8D0"></path>
                                                    <path
                                                        d="M16 25.8548C15.1766 25.8548 14.4047 25.8262 13.6815 25.7685L10.224 29.845C9.96145 30.1546 9.45455 29.9693 9.45455 29.5638V24.9119C5.38354 23.3834 4 19.9647 4 14.4274C4 6.59346 6.76923 3 16 3C25.2308 3 28 6.59346 28 14.4274C28 22.2613 25.2308 25.8548 16 25.8548Z"
                                                        fill="#9179EE">
                                                    </path>
                                                    <path fillRule="evenodd" clipRule="evenodd"
                                                          d="M30 14.3785C30 5.20699 26.7692 1 16 1C5.23077 1 2 5.20699 2 14.3785C2 20.9055 3.63629 24.9182 8.46154 26.6895V29.7774C8.46154 30.9141 9.88769 31.4332 10.6264 30.5656L13.1164 27.6411C14.0113 27.7185 14.9713 27.7569 16 27.7569C26.7692 27.7569 30 23.5499 30 14.3785ZM13.7113 25.5316C14.4251 25.5882 15.1872 25.6164 16 25.6164C25.1124 25.6164 27.8462 22.0825 27.8462 14.3785C27.8462 6.67443 25.1124 3.14055 16 3.14055C6.88757 3.14055 4.15385 6.67443 4.15385 14.3785C4.15385 19.8239 5.51965 23.1859 9.53846 24.6891V29.2639C9.53846 29.6627 10.0389 29.8449 10.2981 29.5404L13.7113 25.5316Z"
                                                          fill="white"></path>
                                                    <path
                                                        d="M11.5432 12.1345L11.5026 12.157L11.4668 12.1866C11.1902 12.4154 10.7756 13.0434 11.1388 13.8197C11.4414 14.4665 12.1157 15.7874 13.3005 16.7826C14.4592 17.756 15.6965 18.2795 16.5092 18.4509L16.5603 18.4617H16.6069C16.6091 18.4619 16.614 18.4624 16.6219 18.4636C16.6412 18.4663 16.6645 18.4703 16.7012 18.4767L16.7874 17.9842L16.7012 18.4767C16.7075 18.4778 16.714 18.479 16.7208 18.4802C16.9709 18.5244 17.5704 18.6304 18.0729 18.1297C18.3954 17.8083 18.6898 17.4732 18.8165 17.3225C18.9055 17.2413 19.1956 17.0731 19.5626 17.1972C20.2576 17.4321 21.0839 17.9621 21.4833 18.2308C21.7925 18.439 22.4924 18.9404 22.8079 19.1682L22.8082 19.1684C22.8344 19.1873 22.8959 19.2493 22.9291 19.3354C22.9557 19.4042 22.97 19.4988 22.9061 19.6357C22.7875 19.8895 22.4266 20.374 21.9378 20.7978C21.4401 21.2294 20.9222 21.5 20.5072 21.5C20.5087 21.5 20.5072 21.4998 20.5025 21.4992C20.484 21.4967 20.4153 21.4874 20.2792 21.4568C20.1262 21.4225 19.9195 21.3686 19.6669 21.2926C19.1622 21.1407 18.485 20.904 17.7029 20.5675C16.1375 19.8941 14.1668 18.8277 12.3218 17.2572C11.1613 16.2694 10.0664 14.9036 9.2138 13.6251C8.35407 12.3358 7.77896 11.1932 7.62244 10.6655L7.61148 10.6285L7.595 10.5937C7.55603 10.5114 7.50112 10.3355 7.50002 10.136C7.49895 9.94333 7.54725 9.75923 7.67465 9.60657C8.09467 9.10322 8.53938 8.60859 9.52049 8.13395C9.61188 8.08974 9.75504 8.05076 9.89575 8.04849C10.04 8.04617 10.1152 8.082 10.1452 8.10835C10.5206 8.43751 11.1025 9.01857 11.4945 9.51513C11.6971 9.77164 11.9418 10.0975 12.1458 10.3806C12.2478 10.5222 12.3377 10.6506 12.4062 10.7527C12.4405 10.8039 12.4679 10.8462 12.4881 10.8788C12.5019 10.9012 12.5093 10.9143 12.5124 10.9199C12.5141 10.9256 12.5218 10.9498 12.5286 10.9939C12.5371 11.0494 12.5411 11.1177 12.5354 11.1891C12.5235 11.3351 12.4755 11.4524 12.3892 11.5315C12.0962 11.7998 11.699 12.0482 11.5432 12.1345ZM16.2766 6.51613C16.2769 6.51585 16.2772 6.51557 16.2775 6.51527C16.2847 6.50852 16.2994 6.5 16.3226 6.5C20.3145 6.5 23.4984 9.53785 23.5 13.223C23.4994 13.2239 23.4983 13.2251 23.4967 13.2267C23.4895 13.2334 23.4747 13.2419 23.4516 13.2419C23.4285 13.2419 23.4137 13.2334 23.4065 13.2267C23.4049 13.2251 23.4039 13.2239 23.4032 13.223C23.4016 9.49946 20.2032 6.53226 16.3226 6.53226C16.2994 6.53226 16.2847 6.52374 16.2775 6.51699C16.2772 6.51669 16.2769 6.5164 16.2766 6.51613ZM16.2775 10.646C16.2772 10.6457 16.2769 10.6454 16.2766 10.6452C16.2769 10.6449 16.2772 10.6446 16.2775 10.6443C16.2847 10.6376 16.2994 10.629 16.3226 10.629C17.8916 10.629 19.1113 11.8182 19.1129 13.223C19.1123 13.2239 19.1112 13.2251 19.1096 13.2267C19.1024 13.2334 19.0877 13.2419 19.0645 13.2419C19.0414 13.2419 19.0266 13.2334 19.0194 13.2267C19.0178 13.2251 19.0168 13.2239 19.0161 13.223C19.0145 11.7799 17.7803 10.6613 16.3226 10.6613C16.2994 10.6613 16.2847 10.6528 16.2775 10.646ZM16.2775 8.5815C16.2772 8.58121 16.2769 8.58092 16.2766 8.58065C16.2769 8.58037 16.2772 8.58008 16.2775 8.57979C16.2847 8.57304 16.2994 8.56452 16.3226 8.56452C19.1031 8.56452 21.3048 10.678 21.3065 13.223C21.3058 13.2239 21.3048 13.2251 21.3032 13.2267C21.296 13.2334 21.2812 13.2419 21.2581 13.2419C21.2349 13.2419 21.2201 13.2334 21.213 13.2267C21.2114 13.2251 21.2103 13.2239 21.2097 13.223C21.2081 10.6397 18.9917 8.59677 16.3226 8.59677C16.2994 8.59677 16.2847 8.58825 16.2775 8.5815Z"
                                                        fill="white" stroke="white" strokeLinecap="round"></path>
                                                </svg>
                                                :
                                                <svg width="24px" height="24px" viewBox="0 0 32 32" fill="none">
                                                    <circle cx="16" cy="16" r="14"
                                                            fill="url(#paint0_linear_87_7225)">
                                                    </circle>
                                                    <path
                                                        d="M22.9866 10.2088C23.1112 9.40332 22.3454 8.76755 21.6292 9.082L7.36482 15.3448C6.85123 15.5703 6.8888 16.3483 7.42147 16.5179L10.3631 17.4547C10.9246 17.6335 11.5325 17.541 12.0228 17.2023L18.655 12.6203C18.855 12.4821 19.073 12.7665 18.9021 12.9426L14.1281 17.8646C13.665 18.3421 13.7569 19.1512 14.314 19.5005L19.659 22.8523C20.2585 23.2282 21.0297 22.8506 21.1418 22.1261L22.9866 10.2088Z"
                                                        fill="white"></path>
                                                    <defs>
                                                        <linearGradient id="paint0_linear_87_7225" x1="16" y1="2"
                                                                        x2="16" y2="30"
                                                                        gradientUnits="userSpaceOnUse">
                                                            <stop stopColor="#37BBFE"></stop>
                                                            <stop offset="1" stopColor="#007DBB"></stop>
                                                        </linearGradient>
                                                    </defs>
                                                </svg>
                                            }
                                        </div>
                                        <div>
                                            {d?.name}
                                        </div>
                                        <div>
                                            <PhoneOutlined style={{marginLeft: '12px', marginRight: '8px'}}/>
                                            {d?.phone}
                                        </div>
                                        <div>
                                            <EnvironmentOutlined style={{marginLeft: '12px', marginRight: '8px'}}/>
                                            {d?.city}
                                        </div>
                                    </div>
                                ),
                            }))}

                        />

                    </div>) : <></>
                }
                <div>
                    <p>Посилання</p>
                    <Input
                        type='text'
                        name='store_link'
                        placeholder='Посилання на кнопці "Замовити" '
                        value={formData.store_link}
                        onChange={handleInputChange}
                        style={{width: '100%', height:'32px'}}
                        status={link_error ? 'error' : ''}
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