"use client";

import React from 'react';
import { useEffect, useState } from 'react';
import Link from "next/link";
import Image from "next/image";
import CardGrid from "@/components/CardGrid";


export interface digitalhubContent {
  id: number;
  title: string;
  description: string;
  image: string;
}

const DigitalHub = (): React.ReactNode => {

    const [content, setContent] = React.useState<digitalhubContent[]>([]);
    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch('/api/DigitalHub');
                // Convert the stream to JSON
                const data = await response.json();
                setContent(data);
            } catch (error) {
              showAlert("An error occurred while attempting to load your data", "toast");
              console.error(error);
            }
        }

        fetchData();

    }, []);
    
    return (
        <div className="p-6 max-w-7xl mx-auto">
          {/* ... rest of the component remains unchanged ... */}
          {content.length ?  ( 
                      <CardGrid content={content} />
                  ) :(
                    <div>Loading...</div>
                  )}
                  </div>
    );
  };

export default DigitalHub;