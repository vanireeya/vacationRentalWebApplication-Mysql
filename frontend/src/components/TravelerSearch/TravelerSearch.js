import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import HeaderTraveller from '../HeaderTraveller/HeaderTraveller'
import cookie from 'react-cookies';
import imgs from './homeimg.jpg'
import { Redirect } from 'react-router';
import axios from 'axios';


class TravelerSearch extends Component {
    constructor(props) {
        super(props);
        let myData = JSON.parse(localStorage.getItem('myData'));
        if (this.props.location.state && this.props.location.state.property) {
            console.log(this.props.location.state.property)
            let response = this.props.location.state.property;
            for (let i = 0; i < response.length; i++) {
                let tempProperty = response[i].showImages;
                for (let j = 0; j < tempProperty.length; j++) {
                    let temp = 'data:image/jpg;base64, ' + response[i].showImages[j]
                    response[i].showImages[j] = temp
                }
            }
            this.state = {
                myData:myData,
                properties: response,
                bookProp: {},
                search: JSON.parse(this.props.location.state.search),
                authFlag:false
            }
        } else {
            this.state = {
                myData:myData,
                properties: [],
                bookProp: {},
                search: JSON.parse(this.props.location.state.search),
                authFlag:false
            }
        }
        console.log(this.state.search)
        this.setBookProperty = this.setBookProperty.bind(this);
        this.CimagesPopUp = this.CimagesPopUp.bind(this);
        this.blockProperty = this.blockProperty.bind(this)
    }
    componentDidMount() {


    }

    blockProperty() {
        let data={
            pid:this.state.bookProp.pid,
            block_from:this.state.search.tripStart,
            block_to:this.state.search.tripEnd,
            email:this.state.myData.email
        }
        axios.defaults.withCredentials = true;
        axios.post('http://localhost:3001/book_property', data)
            .then(response => {
                console.log("Status Code : ", response.status);
                if (response.status === 200) {
                    console.log(response.data)
                    this.setState({
                        authFlag:true
                    })
                } else {

                }
            }, resp => {
                if (resp.response && resp.response.data && resp.response.data.status === -1) {
                    alert("Oops!! something went wrong!")
                }
            });
    }


    setBookProperty(property) {
        this.setState({
            bookProp: property
        })
    }



    CimagesPopUp() {
        if (this.state && this.state.bookProp && this.state.bookProp.showImages) {
            let details = this.state.bookProp.showImages.map((imgs, key) => {
                console.log(key)
                if (key == 0) {
                    return (
                        <div style={{ overflow: "hidden" }} class="item active">
                            <img src={imgs} />
                        </div>
                    )
                } else {
                    return (
                        <div style={{ overflow: "hidden" }} class="item">
                            <img src={imgs} />
                        </div>
                    )
                }

            })
            return details
        } else {
            return null
        }

    }
    Cimages({ property }) {

        let details = property.showImages.map((imgs, key) => {
            
            if (key == 0) {
                return (
                    <div style={{ overflow: "hidden" }} class="item active">
                        <img src={imgs} />
                    </div>
                )
            } else {
                return (
                    <div style={{ overflow: "hidden" }} class="item">
                        <img src={imgs} />
                    </div>
                )
            }

        })
        return details
    }
    render() {
        require('./TravelerSearch.css')

        let propertyList,redirectVar;
        if (this.state.properties && this.state.properties.length > 0) {
            propertyList = this.state.properties.map(property => {
                return (
                    <tr className="trstyling">
                        <td className="tdStyling" style={{ width: "31%", padding: "10px" }}>
                            {/* <img src={property.showImages[1]} /> */}
                            <div style={{ width: "96%", "overflow": "hidden" }} id={"slider" + property.pid} class="carousel slide" data-ride="carousel">

                                {/* <ol class="carousel-indicators">
                                    <li data-target={"#slider" + property.pid} data-slide-to="0" class="active"></li>
                                    <li data-target={"#slider" + property.pid} data-slide-to="1"></li>
                                    <li data-target={"#slider" + property.pid} data-slide-to="2"></li>
                                </ol> */}


                                <div class="carousel-inner">


                                    <this.Cimages property={property} />
                                </div>

                                <a class="left carousel-control" href={"#slider" + property.pid} data-slide="prev">
                                    <span class="glyphicon glyphicon-chevron-left"></span>
                                    <span class="sr-only">Previous</span>
                                </a>
                                <a class="right carousel-control" href={"#slider" + property.pid} data-slide="next">
                                    <span class="glyphicon glyphicon-chevron-right"></span>
                                    <span class="sr-only">Next</span>
                                </a>
                            </div>
                        </td>
                        <td className="tdStyling" style={{ width: "60%", padding: "10px" }}>
                            <div style={{ marginLeft: "10%" }}>
                                <div className="headingFont">{property.headline}</div>
                                <div className="addressFont margin10">{property.street + " " + property.city + " " + property.state + " " + property.country} </div>
                                <div className="margin10 descFont" style={{ width: "50%" }}>{property.description} </div>
                                <div className="margin10">
                                    <div>
                                        <span className="spanDiv">{property.apt_type}</span>
                                        <span className="marginLeft10 spanDiv">{property.bedrooms}BR</span>
                                        <span className="marginLeft10 spanDiv">{property.bathrooms}BA</span>
                                        <span className="marginLeft10 spanDiv">Sleeps {property.accomodates}</span>
                                    </div>
                                    <div>USD: {property.rent} per night</div>
                                    <div>Availablity: {property.availablefrom} - {property.availabletill}</div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <button className="btn btn-primary" data-toggle="modal" onClick={() => {
                                this.setBookProperty(property)
                            }} data-target="#myModal">Book Now!</button>
                        </td>
                    </tr>
                    //    {testtr}
                )
            })
        } else {
            propertyList = <div style={{ color: "#200755", padding: "10px 10px 10px 0px" }}>
                <h2>No property found for your search!</h2>
            </div>
        }

        if(this.state.authFlag){
            redirectVar = <Redirect to="/MytripTraveller" />
            
        }
        return (
            <div >
                {redirectVar}

                <HeaderTraveller />
                <div>
                    <div>
                        <div className="outerDiv11 mainHeadFont">Property Lists</div>
                        <div className="outerDiv">
                            <table style={{ marginTop: "10px" }}>
                                {propertyList}
                            </table>
                        </div>
                    </div>

                </div>
                <div class="modal" id="myModal" style={{ marginTop: "-24px" }}>
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-body" >
                                <button type="button" class="close" style={{ marginRight: "0px" }} data-dismiss="modal">&times;</button>

                                <div style={{ width: "95%", "overflow": "hidden", height: "398px", marginLeft: "3%" }} class="carousel slide" id="MyCarousel">
                                    <div class="carousel-inner">
                                        <this.CimagesPopUp />
                                    </div>
                                    <a href="#MyCarousel" class="left carousel-control" data-slide="prev"><span class="icon-prev"></span></a>
                                    <a href="#MyCarousel" class="right carousel-control" data-slide="next"><span class="icon-next"></span></a>
                                </div>
                                <table style={{ marginTop: "10px" }}>
                                    <tr>
                                        <td className="popTr">
                                            <div style={{ fontSize: "11px", color: "#7a868e" }}>Check-in</div>
                                            <div style={{ fontSize: "13px", color: "#0067db" }}>{this.state.search.tripStart}</div>
                                        </td>
                                        <td className="popTr">
                                            <div style={{ fontSize: "11px", color: "#7a868e" }}>Check-out</div>
                                            <div style={{ fontSize: "13px", color: "#0067db" }}>{this.state.search.tripEnd}</div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="popTr" colSpan="2">
                                            <div style={{ fontSize: "11px", color: "#7a868e" }}>guest</div>
                                            <div style={{ fontSize: "13px", color: "#0067db" }}>{this.state.search.guests}</div>
                                        </td>
                                    </tr>
                                </table>

                                <div style={{ marginTop: "10px", marginLeft: "0" }}>
                                    <span style={{ fontSize: "17px", float: "left", marginLeft: "10px" }} className="fontDesign">${this.state.bookProp.rent}.00 x {this.state.bookProp.days} nights</span>
                                    <span style={{ fontSize: "17px", float: "right", marginRight: "10px" }} className="fontDesign"> ${this.state.bookProp.totalCost}.00</span>
                                </div>
                                {/* <div style={{ marginTop: "2px",marginLeft:"1.3%" }}>
                                    <span style={{ fontSize: "17px" }}>Days:</span>
                                    <span style={{ fontSize: "17px" }}> {this.state.bookProp.days}</span>
                                </div>
                                <div style={{ marginTop: "2px" ,marginLeft:"1.3%"}}>
                                    <span style={{ fontSize: "17px" }}>Total: </span>
                                    <span style={{ fontSize: "17px" }}>${this.state.bookProp.totalCost}</span>
                                </div> */}
                                <div style={{ textAlign: "center", marginTop: "35px" }}>
                                    <button type="button" onClick={this.blockProperty} class="btn btn-primary" style={{ borderRadius: "27px" }} data-dismiss="modal">Book Now</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default TravelerSearch;