import {
  Layout,
  Button,
  Row,
  Col,
  Form,
  Input,
  message
} from "antd";
import {url} from "../Config.jsx";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const SignIn  = () => {
  const { Content } = Layout;
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      const loginData = {
        ...values
      }
      const {data} = await axios.post(
          `${url}/api/v1/admin/login`,loginData,
          {withCredentials: true}
      );

      const error_message = data.errorMessage;
      const {success} = data;

      if (success) {
        setTimeout(() => {
          navigate("/");
        }, 1000);
      } else {
        message.warning(error_message)
      }
    } catch (error) {
      console.error(error);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };

    return (
      <>
        <Layout className="layout-default layout-signin">
          <Content className="signin">
            <Row gutter={[24, 0]} justify="space-around">
              <Col
                  xs={{ span: 24, offset: 0 }}
                  md={{ span: 6 }}
              >
                <div style={{width: '100%', display:'flex', margin: '0 auto'}}>
                </div>
                <Form
                  onFinish={onFinish}
                  onFinishFailed={onFinishFailed}
                  layout="vertical"
                  className="row-col"
                  autoComplete="off"
                >
                  <Form.Item
                    className="username"
                    name="email"
                    rules={[
                      {
                        required: true,
                        message: "Введіть email користувача",
                      },
                    ]}
                  >
                    <Input name="email" placeholder="Email" style={{height:'48px', padding: '8px 22px'}} />
                  </Form.Item>

                  <Form.Item
                    className="username"
                    name="password"
                    rules={[
                      {
                        required: true,
                        message: "Введіть пароль користувача",
                      },
                    ]}
                  >
                    <Input.Password  name="password" placeholder="Password" />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      className='login_button'
                      htmlType="submit"
                      style={{ width: "100%" }}
                    >
                      Login
                    </Button>
                  </Form.Item>
                </Form>
              </Col>
            </Row>
          </Content>
        </Layout>
      </>
    );
}

export default SignIn;