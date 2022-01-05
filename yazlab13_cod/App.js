//Furkan Enes Demir 170201117

import React from "react";
import {View, Text, Image, Button, FlatList} from "react-native";
import * as ImagePicker from 'react-native-image-picker';
import * as uuid from 'uuid';
import firebase from './config/firebase';

export default class App extends React.Component{
  state = {
    image: null,
    uploading: false,
		googleResponse: null,
  };

  varsaResimYukle = () => {
		let { image, googleResponse } = this.state;
		if (!image) {
			return;
		}

		return (
			<View
				style={{
					marginTop: 20,
					width: 250,
					borderRadius: 3,
					elevation: 2
				}}
			>
				<Button
					style={{ marginBottom: 10 }}
					onPress={() => this.googleGonder()}
					title="Objeleri Tespit Et"
				/>

				<View
					style={{
						borderTopRightRadius: 2,
						borderTopLeftRadius: 2,
						shadowOpacity: 0.2,
						shadowOffset: { width: 4, height: 4 },
						shadowRadius: 4,
						overflow: 'hidden'
					}}
				>
					<Image source={{ uri: image.uri }} style={{ width: 250, height: 250 }} />
				</View>
				<Text	style={{ paddingVertical: 10, paddingHorizontal: 10 }}/>

				<Text>Cevap:</Text>

				{googleResponse && (
					<Text style={{ paddingVertical: 10, paddingHorizontal: 10 }}>
						{JSON.stringify(googleResponse.responses)}
					</Text>
				)}
			</View>
		);
	};

  googleGonder = async () => {
    try {
      this.setState({ uploading: true });
      let { image } = this.state;
      let body = JSON.stringify({
        requests: [
          {
            features: [
              { maxResults: 20 , type: 'OBJECT_LOCALIZATION'}
            ],
            image: {
              source: {
                imageUri: uploadUrl
              }
            }
          }
        ]
      });
      let response = await fetch(
        'https://vision.googleapis.com/v1/images:annotate?key=' +
         'AIzaSyDqUsTFE2wXq8kkqPaCND-LZf0bHkbbRCs',
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          method: 'POST',
          body: body
        }
      );
      let responseJson = await response.json();
      console.log(responseJson);
      this.setState({
        googleResponse: responseJson,
        uploading: false
      });
    } catch (error) {
      console.log(error);
    }
  };

  handleResimSec = async () => {
    const options = {

    };
    ImagePicker.launchImageLibrary(options, response => {
      console.log("response", response);
      if(response.uri){
        try {
          this.setState({ image: response ,uploading: true });
          uploadUrl = asenkronYukle(response.uri);
        } catch (e) {
          console.log(e);
          alert('Hata yukleme basarisiz oldu.');
        } finally {
          this.setState({ uploading: false });
        }
      }
    });
  };

  handleResimCek = async () =>{
    const options = {

    };
    ImagePicker.launchCamera(options, response => {
      console.log("response", response);
      if(response.uri){
        try {
          this.setState({ image: response ,uploading: true });
          uploadUrl = asenkronYukle(response.uri);
        } catch (e) {
          console.log(e);
          alert('Hata fotograf cekme basarisiz oldu.');
        } finally {
          this.setState({ uploading: false });
        }
      }
    });
  };

  render(){
    let {image} = this.state;
    return(
      <View style = {{flex: 1, alignItems: "center", justifyContent: "center"}}>
        <Button title = "Galeriden Sec" onPress = {this.handleResimSec}/>
        <Button title = "Fotograf Cek" onPress = {this.handleResimCek}/>
        {this.state.googleResponse && (
							<FlatList
								data={this.state.googleResponse/*.responses[0].labelAnnotations*/}
								extraData={this.state}
								keyExtractor={this._keyExtractor}
                renderItem={({ item }) => <Text>Text Detected: {item.text}</Text>}
							/>
						)}
						{this.varsaResimYukle()}
      </View>
    );
  }

}

async function asenkronYukle(uri) {
	const blob = await new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.onload = function() {
			resolve(xhr.response);
		};
		xhr.onerror = function(e) {
			console.log(e);
			reject(new TypeError('Baglanti basarisiz oldu.'));
		};
		xhr.responseType = 'blob';
		xhr.open('GET', uri, true);
		xhr.send(null);
	});

	const ref = firebase
		.storage()
		.ref()
		.child(uuid.v4());
	const snapshot = await ref.put(blob);

	blob.close();

	return await snapshot.ref.getDownloadURL();
}

