import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { Modal, Button, CloseButton } from 'react-bootstrap';
import { Denizen } from './Denizen';
import Loader from 'react-loader';
import html2canvas from 'html2canvas';

export default class ReactPositive extends React.Component {

    constructor(props) {
        super(props);
        this.initialState();

        this.submitFeedback = this.submitFeedback.bind(this);
        this.openModal = this.openModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.inputChange = this.inputChange.bind(this);
        this.toggleScreenshot = this.toggleScreenshot.bind(this);
        this.toggleLocation = this.toggleLocation.bind(this);
        this.loadContent = this.loadContent.bind(this);
    }

    initialState() {
        this.state = {
            open: false,
            formData: {
                email: this.props.defaultEmail,
                description: '',
                browser: null,
                image: null
            },
            screenshotLoaded: true,
            sendScreenshot: true,
            sendLocation: false,
            displayFormLoader: false
        };
    }

    updateState(portion) {
        this.setState(Object.assign(this.state, portion));
    }

    componentDidMount() {

    }

    loadContent() {
        this.getBrowserData();
        this.generateScreenshot();
    }

    generateScreenshot() {
        let objectRef = this;

        if (this.state.formData.image === null) {
            objectRef.updateState({ screenshotLoaded: false });
            html2canvas(document.body)
                .then(canvas => {
                    objectRef.updateFormData('image', canvas.toDataURL('image/png'));
                    objectRef.updateState({ screenshotLoaded: true });
                });
        }
    }

    toggleScreenshot(event) {
        this.updateState({ sendScreenshot: event.target.checked });
    }

    renderScreenshot() {
        if (!this.state.sendScreenshot) {
            return (null);
        }

        if (this.state.screenshotLoaded && this.state.formData.image == null) {
            return (null);
        }

        let loaderOptions = {
            lines: 13, // The number of lines to draw
            length: 34, // The length of each line
            width: 14, // The line thickness
            radius: 0, // The radius of the inner circle
            scale: 0.45, // Scales overall size of the spinner
            corners: 0, // Corner roundness (0..1)
            color: '#005289',
            opacity: 0.25,
            rotate: 0,
            direction: 1,
            speed: 1,
            trail: 60,
            fps: 20,
            zIndex: 2e9
        };

        return (
            <div id="screenshot-placeholder">
                <div className="preview">
                    <Loader options={loaderOptions} loaded={this.state.screenshotLoaded }>
                        <img className="img-responsive" src={this.state.formData.image} />
                    </Loader>
                </div>
            </div>
        );
    }

    toggleLocation(event) {
        let checked = event.target.checked;
        this.updateState({ sendLocation: event.target.checked });

        this.getBrowserData();
    }

    getBrowserData() {
        let objectRef = this;
        let denizen = new Denizen();

        if (!this.state.sendLocation) {
            this.updateFormData('browser', denizen.getData());
            return;
        }

        denizen = new Denizen({
            afterLocationSet: function (data) {
                objectRef.updateFormData('browser', data);
            }
        });
        denizen.setLocation();
    }

    updateFormData(field, value) {
        this.updateState({
            formData: Object.assign(
                this.state.formData,
                { [field]: value }
            )
        });
    }

    inputChange(event) {
        let name = event.target.getAttribute('name');
        let value = event.target.value;

        if (event.target.getAttribute('type') == 'checkbox') {
            value = event.target.checked;
        }
        this.updateFormData(
            name,
            value
        );
    }

    openModal(event) {
        this.updateState({ open: true });
    }

    closeModal(event) {
        this.updateState({ open: false });
    }

    submitFeedback(event) {
        let objectRef = this;
        event.preventDefault();

        let data = Object.assign(
            this.state.formData,
            {
                browser: JSON.stringify(this.state.formData.browser),
                image: this.state.formData.image
            }
        );

        this.updateState({ displayFormLoader: true });
        axios
            .post(this.props.feedbackController, data)
            .then(res => {
                objectRef.initialState();
                objectRef.forceUpdate();
            })
            .catch(error => {
                this.updateState({ displayFormLoader: false });
            });
    }

    renderModalBody() {

        return (
            <div className="feedback-form-wrapper">
                <div className="form-group">
                    <div className="input-group">
                        <span className="input-group-addon"><i className="fa fa-envelope-o"/></span>
                        <input id="email"
                               type="email"
                               name="email"
                               onChange={this.inputChange}
                               required="required"
                               value={this.state.formData.email}
                               className="form-control"
                               placeholder={this.props.emailPlaceholder} />
                    </div>
                </div>
                <div className="form-group">
                    <div className="input-group">
                        <span className="input-group-addon"><i className="fa fa-file-text-o"/></span>
                        <textarea id="description"
                                  required="required"
                                  className="form-control"
                                  name="description"
                                  onChange={this.inputChange}
                                  value={this.state.formData.description}
                                  placeholder="Please write your question or leave your feedback here" />
                    </div>
                </div>
                <div className="form-group">
                    <div className="checkbox">
                        <label>
                            <input id="screenshot-checkbox"
                                   type="checkbox"
                                   name="send_screenshot"
                                   value={true}
                                   onChange={this.toggleScreenshot}
                                   checked={this.state.sendScreenshot} />Send screenshot
                        </label>
                    </div>
                    <div className="checkbox">
                        <label>
                            <input id="location-checkbox"
                                   type="checkbox"
                                   name="send_location"
                                   value={true}
                                   onChange={this.toggleLocation}
                                   checked={this.state.sendLocation} />Send location
                        </label>
                    </div>
                    {this.renderScreenshot()}
                </div>
            </div>
        );
    }

    renderModal() {
        let formLoader = null;
        if (this.state.displayFormLoader) {
            formLoader = (<i className="fa fa-circle-o-notch fa-spin"/>);
        }

        return (
            <Modal show={this.state.open}
                   onEntered={this.loadContent}
                   backdrop={false}
                   id="feedback-modal"
                   data-html2canvas-ignore={true}
                   aria-labelledby="feedback-modal-title">
                <form className="feedback-form" action="#" method="post" onSubmit={this.submitFeedback}>
                    <Modal.Header>
                        <Modal.Title id="feedback-modal-title">
                            {this.props.title}
                            <CloseButton label="Close" onClick={this.closeModal}/>
                        </Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        {this.renderModalBody()}
                    </Modal.Body>

                    <Modal.Footer>
                        <Button bsStyle="danger" onClick={this.closeModal}><b>Cancel</b></Button>
                        <Button type="submit" bsStyle="primary">
                            Send feedback&nbsp;{formLoader}
                        </Button>
                    </Modal.Footer>
                </form>
            </Modal>
        );
    }

    render() {
        return (
            <div id="feedback-wrapper" data-html2canvas-ignore={true}>
                <button id="feedback-button"
                        className="btn btn-primary"
                        onClick={this.openModal}
                        data-html2canvas-ignore={true}>
                    <i className="fa fa-exclamation-circle" />
                </button>
                {this.renderModal()}
            </div>
        );
    }
}

ReactPositive.defaultProps = {
    title: 'Send feedback',
    emailPlaceholder: 'Please enter your email',
    defaultEmail: ''
};

ReactPositive.propTypes = {
    title: PropTypes.string,
    emailPlaceholder: PropTypes.string,
    feedbackController: PropTypes.string.isRequired,
    defaultEmail: PropTypes.string
};